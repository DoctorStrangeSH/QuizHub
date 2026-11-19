import { isDeepStrictEqual } from 'node:util';
import { assertIsolatedQuizHubEmulator } from './backup-restore-emulator.mjs';
import { directChatId } from './chat-send.mjs';
import { planLegacyChatMigration } from './chat-migration-preflight.mjs';

// Explicitly disposable-emulator-only experiment, not a production migrator.
// Only handles legacy chats whose parent is missing but messages survive.
export async function copyOrphanChatInEmulator(db, plan, { confirmation } = {}) {
    assertIsolatedQuizHubEmulator();
    if (confirmation !== 'COPY_ORPHAN_CHAT_IN_DISPOSABLE_EMULATOR') {
        throw new Error('EXPLICIT_EMULATOR_CHAT_COPY_CONFIRMATION_REQUIRED');
    }
    if (!db || typeof db.runTransaction !== 'function' || !plan ||
        !Array.isArray(plan.memberUids) || plan.memberUids.length !== 2 ||
        !Array.isArray(plan.messageIds) || !plan.messageIds.length || plan.messageIds.length > 100) {
        throw new TypeError('INVALID_EMULATOR_CHAT_COPY_PLAN');
    }
    const [first, second] = [...plan.memberUids].sort();
    const expectedId = directChatId(first, second);
    const legacyId = `${first}_${second}`;
    if (plan.legacyId !== legacyId || plan.nextId !== expectedId ||
        new Set(plan.messageIds).size !== plan.messageIds.length ||
        plan.messageIds.some(id => typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id))) {
        throw new TypeError('INVALID_EMULATOR_CHAT_COPY_PATHS');
    }
    const legacy = db.collection('chats').doc(legacyId);
    const destination = db.collection('chats').doc(expectedId);
    const aRef = db.collection('users').doc(first);
    const bRef = db.collection('users').doc(second);

    await db.runTransaction(async tx => {
        // All reads precede writes. Queries include orphaned subcollections.
        const [a, b, legacyParent, targetParent, sourceMessages, targetMessages] = await Promise.all([
            tx.get(aRef), tx.get(bRef), tx.get(legacy), tx.get(destination),
            tx.get(legacy.collection('messages')), tx.get(destination.collection('messages'))
        ]);
        if (!a.exists || !b.exists || !Array.isArray(a.data().friends) ||
            !Array.isArray(b.data().friends) ||
            !a.data().friends.includes(second) || !b.data().friends.includes(first)) {
            throw new Error('CHAT_COPY_FRIENDSHIP_CHANGED');
        }
        // An existing parent may have unknown metadata: never silently drop it.
        if (legacyParent.exists) throw new Error('CHAT_COPY_PARENT_METADATA_REQUIRES_REVIEW');
        if (targetParent.exists || !targetMessages.empty) throw new Error('CHAT_COPY_DESTINATION_NOT_EMPTY');
        const actualIds = sourceMessages.docs.map(doc => doc.id).sort();
        if (!isDeepStrictEqual(actualIds, [...plan.messageIds].sort())) {
            throw new Error('CHAT_COPY_SOURCE_CHANGED');
        }
        if (sourceMessages.docs.some(doc => ![first, second].includes(doc.data().senderId))) {
            throw new Error('CHAT_COPY_UNKNOWN_SENDER');
        }
        // Revalidate current data in the same transaction as the copy. A
        // once-green inventory must not authorize changed or corrupt records.
        const currentPlan = planLegacyChatMigration({
            users: [
                { uid: first, friends: a.data().friends },
                { uid: second, friends: b.data().friends }
            ],
            messages: sourceMessages.docs.map(doc => ({ chatId: legacyId, messageId: doc.id,
                senderId: doc.data().senderId, reactions: doc.data().reactions,
                deleted: doc.data().deleted }))
        });
        if (!currentPlan.ready || currentPlan.mappedMessages !== plan.messageIds.length) {
            throw new Error('CHAT_COPY_SOURCE_VALIDATION_FAILED');
        }
        tx.create(destination, { memberUids: [first, second], createdAt: new Date() });
        for (const doc of sourceMessages.docs) {
            // Preserve every legacy field (timestamps, replyTo, reactions,
            // edited/deleted flags) unchanged instead of reconstructing it.
            tx.create(destination.collection('messages').doc(doc.id), doc.data());
        }
    });

    // Verify both sides after the transaction. Never delete legacy history.
    for (const id of plan.messageIds) {
        const [source, copied] = await Promise.all([
            legacy.collection('messages').doc(id).get(),
            destination.collection('messages').doc(id).get()
        ]);
        if (!source.exists || !copied.exists || !isDeepStrictEqual(source.data(), copied.data())) {
            throw new Error('CHAT_COPY_VERIFICATION_FAILED');
        }
    }
    return { status: 'copied_and_verified', sourceChatId: legacyId, destinationChatId: expectedId,
        messageCount: plan.messageIds.length, originalsDeleted: 0 };
}
