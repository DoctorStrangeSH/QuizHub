import { isDeepStrictEqual } from 'node:util';
import { assertIsolatedQuizHubEmulator } from './backup-restore-emulator.mjs';
import { directChatId } from './chat-send.mjs';
import { planLegacyChatMigration } from './chat-migration-preflight.mjs';

const MAX_MESSAGES = 5000;
const MAX_BATCH = 100;
const MIGRATION_VERSION = 1;
const CONFIRMATION = 'COPY_CHAT_IN_CHUNKS_IN_DISPOSABLE_EMULATOR';

function validatePlan(plan) {
    if (!plan || !Array.isArray(plan.memberUids) || plan.memberUids.length !== 2 ||
        !Array.isArray(plan.messageIds) || !plan.messageIds.length ||
        plan.messageIds.length > MAX_MESSAGES) throw new TypeError('INVALID_CHUNKED_CHAT_COPY_PLAN');
    const [first, second] = [...plan.memberUids].sort();
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(first) || !/^[A-Za-z0-9_-]{1,128}$/.test(second) ||
        first === second || plan.legacyId !== `${first}_${second}` ||
        plan.nextId !== directChatId(first, second) ||
        new Set(plan.messageIds).size !== plan.messageIds.length ||
        plan.messageIds.some(id => typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id))) {
        throw new TypeError('INVALID_CHUNKED_CHAT_COPY_PATHS');
    }
    return [first, second];
}

// Idempotent, bounded, emulator-only migration. A retry safely skips already
// copied documents only when their full contents match. Source history is never
// deleted. A failed run can be repeated with the same plan to resume.
export async function copyLegacyChatInChunksEmulator(db, plan, {
    confirmation, batchSize = MAX_BATCH, stopAfterBatches = Infinity
} = {}) {
    assertIsolatedQuizHubEmulator();
    if (confirmation !== CONFIRMATION) throw new Error('EXPLICIT_EMULATOR_CHAT_COPY_CONFIRMATION_REQUIRED');
    if (!db || typeof db.runTransaction !== 'function' ||
        !Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > MAX_BATCH ||
        !(stopAfterBatches === Infinity || (Number.isSafeInteger(stopAfterBatches) && stopAfterBatches > 0))) {
        throw new TypeError('INVALID_CHUNKED_CHAT_COPY_CONFIG');
    }
    const [first, second] = validatePlan(plan);
    const legacy = db.collection('chats').doc(plan.legacyId);
    const destination = db.collection('chats').doc(plan.nextId);
    const users = [db.collection('users').doc(first), db.collection('users').doc(second)];
    const sourceCollection = legacy.collection('messages');

    const listedSourceRefs = await sourceCollection.listDocuments();
    const listedIds = listedSourceRefs.map(ref => ref.id).sort();
    if (!isDeepStrictEqual(listedIds, [...plan.messageIds].sort())) {
        throw new Error('CHAT_CHUNK_SOURCE_CHANGED');
    }
    const batches = [];
    for (let i = 0; i < plan.messageIds.length; i += batchSize) {
        batches.push(plan.messageIds.slice(i, i + batchSize));
    }

    let completedBatches = 0;
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        if (completedBatches >= stopAfterBatches) {
            return { status: 'paused', sourceChatId: plan.legacyId, destinationChatId: plan.nextId,
                completedBatches, totalBatches: batches.length, copiedMessageCount: Math.min(batchIndex * batchSize, plan.messageIds.length),
                originalsDeleted: 0 };
        }
        const ids = batches[batchIndex];
        const sourceRefs = ids.map(id => sourceCollection.doc(id));
        const destinationRefs = ids.map(id => destination.collection('messages').doc(id));

        await db.runTransaction(async tx => {
            const [userA, userB, sourceParent, destinationParent, ...snapshots] = await Promise.all([
                tx.get(users[0]), tx.get(users[1]), tx.get(legacy), tx.get(destination),
                ...sourceRefs.map(ref => tx.get(ref)), ...destinationRefs.map(ref => tx.get(ref))
            ]);
            if (!userA.exists || !userB.exists || !Array.isArray(userA.data().friends) ||
                !Array.isArray(userB.data().friends) || !userA.data().friends.includes(second) ||
                !userB.data().friends.includes(first)) throw new Error('CHAT_COPY_FRIENDSHIP_CHANGED');
            if (sourceParent.exists) throw new Error('CHAT_COPY_PARENT_METADATA_REQUIRES_REVIEW');

            if (destinationParent.exists) {
                const data = destinationParent.data();
                if (!isDeepStrictEqual(data.memberUids, [first, second]) ||
                    data.migrationSourceChatId !== plan.legacyId ||
                    data.migrationVersion !== MIGRATION_VERSION) {
                    throw new Error('CHAT_COPY_DESTINATION_METADATA_CONFLICT');
                }
            } else if (batchIndex > 0) {
                throw new Error('CHAT_COPY_DESTINATION_PARENT_MISSING');
            }

            const sourceSnaps = snapshots.slice(0, ids.length);
            const destinationSnaps = snapshots.slice(ids.length);
            if (sourceSnaps.some(snapshot => !snapshot.exists)) throw new Error('CHAT_CHUNK_SOURCE_CHANGED');

            const currentPlan = planLegacyChatMigration({
                users: [
                    { uid: first, friends: userA.data().friends },
                    { uid: second, friends: userB.data().friends }
                ],
                messages: sourceSnaps.map((snapshot, index) => {
                    const data = snapshot.data();
                    return { chatId: plan.legacyId, messageId: ids[index], senderId: data.senderId,
                        reactions: data.reactions, deleted: data.deleted };
                })
            });
            if (!currentPlan.ready || currentPlan.mappedMessages !== ids.length) {
                throw new Error('CHAT_CHUNK_SOURCE_VALIDATION_FAILED');
            }

            if (!destinationParent.exists) {
                tx.create(destination, {
                    memberUids: [first, second],
                    migrationSourceChatId: plan.legacyId,
                    migrationVersion: MIGRATION_VERSION,
                    createdAt: new Date()
                });
            }
            for (let i = 0; i < ids.length; i++) {
                const sourceData = sourceSnaps[i].data();
                const target = destinationSnaps[i];
                if (target.exists) {
                    if (!isDeepStrictEqual(target.data(), sourceData)) {
                        throw new Error('CHAT_CHUNK_DESTINATION_CONFLICT');
                    }
                } else {
                    tx.create(destinationRefs[i], sourceData);
                }
            }
        });
        completedBatches++;
    }

    // A final inventory catches concurrent legacy writes that arrived while
    // chunks were being copied. It never removes the already copied safe subset.
    const finalSourceRefs = await sourceCollection.listDocuments();
    if (!isDeepStrictEqual(finalSourceRefs.map(ref => ref.id).sort(), [...plan.messageIds].sort())) {
        throw new Error('CHAT_CHUNK_SOURCE_CHANGED_DURING_COPY');
    }
    for (const id of plan.messageIds) {
        const [source, copied] = await Promise.all([
            sourceCollection.doc(id).get(), destination.collection('messages').doc(id).get()
        ]);
        if (!source.exists || !copied.exists || !isDeepStrictEqual(source.data(), copied.data())) {
            throw new Error('CHAT_CHUNK_VERIFICATION_FAILED');
        }
    }
    return { status: 'copied_and_verified', sourceChatId: plan.legacyId, destinationChatId: plan.nextId,
        messageCount: plan.messageIds.length, completedBatches, totalBatches: batches.length, originalsDeleted: 0 };
}
