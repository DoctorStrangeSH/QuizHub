import assert from 'node:assert/strict';
import test from 'node:test';
import { planPublicProfileBackfill } from '../server/public-profile-backfill.mjs';

const project = 'demo-quizhub';
const root = `http://127.0.0.1:8080/v1/projects/${project}/databases/(default)/documents`;

function encode(data) {
    return { fields: Object.fromEntries(Object.entries(data).map(([key, value]) =>
        [key, typeof value === 'number' ? { integerValue: String(value) } : { stringValue: value }])) };
}

function decode(snapshot) {
    return Object.fromEntries(Object.entries(snapshot.fields || {}).map(([key, value]) =>
        [key, 'integerValue' in value ? Number(value.integerValue) : value.stringValue]));
}

async function writeDocument(path, data) {
    const response = await fetch(`${root}/${path}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(encode(data))
    });
    assert.equal(response.status, 200, `Write failed for ${path}: ${await response.text()}`);
}

async function readDocument(path) {
    const response = await fetch(`${root}/${path}`);
    assert.equal(response.status, 200, `Read failed for ${path}: ${await response.text()}`);
    return decode(await response.json());
}

test('Firestore Emulator: public profile migration omits PII and is idempotent', async () => {
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project);
    assert.match(process.env.FIRESTORE_EMULATOR_HOST || '', /^(127\\.0\\.0\\.1|localhost):8080$/);

    const suffix = Date.now().toString(36);
    const uidA = `migrationA${suffix}`;
    const uidB = `migrationB${suffix}`;
    const privateUsers = [
        { uid: uidA, data: { nickname: 'MigrationOne', level: 2, experience: 120,
            weeklyExperience: 25, wins: 3, equippedFrame: 'frame_gold',
            email: 'alice@example.test', coins: 7890 } },
        { uid: uidB, data: { nickname: 'MigrationTwo', level: 4, experience: 500,
            weeklyExperience: 44, wins: 12, equippedFrame: 'frame_default',
            email: 'bob@example.test', coins: 9999 } }
    ];

    for (const user of privateUsers) {
        await writeDocument(`users/${user.uid}`, user.data);
    }
    const sourceRecords = [];
    for (const user of privateUsers) {
        sourceRecords.push({ uid: user.uid, data: await readDocument(`users/${user.uid}`) });
    }
    const plan = planPublicProfileBackfill(sourceRecords, [], { batchSize: 1 });
    assert.equal(plan.writeCount, 2);
    assert.equal(plan.batches.length, 2);

    for (const batch of plan.batches) {
        for (const write of batch) {
            await writeDocument(write.path, write.data);
        }
    }
    const existing = [];
    for (const user of privateUsers) {
        const data = await readDocument(`publicProfiles/${user.uid}`);
        assert.ok(!('email' in data) && !('coins' in data), 'PII or balances leaked to public collection');
        assert.equal(data.nickname, user.data.nickname);
        existing.push({ uid: user.uid, data });
    }
    const secondRun = planPublicProfileBackfill(sourceRecords, existing);
    assert.equal(secondRun.writeCount, 0);
    assert.equal(secondRun.skippedCount, 2);
    assert.equal(secondRun.conflictCount, 0);
});
