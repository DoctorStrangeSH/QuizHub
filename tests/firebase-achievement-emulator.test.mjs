import assert from 'node:assert/strict';
import test from 'node:test';

const project = 'demo-quizhub';
const authBase = 'http://127.0.0.1:9099';
const callableUrl = `http://127.0.0.1:5001/${project}/europe-west1/achievementUnlockPreview`;
const firestoreBase = `http://127.0.0.1:8080/v1/projects/${project}/databases/(default)/documents`;

async function signIn() {
    const response = await fetch(`${authBase}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-key`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}'
    });
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    return { token: body.idToken, uid: body.localId };
}

async function invoke(user, data = { operation: 'evaluate', payload: {} }) {
    const response = await fetch(callableUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(user?.token ? { authorization: `Bearer ${user.token}` } : {}) },
        body: JSON.stringify({ data })
    });
    return { status: response.status, body: await response.json() };
}

async function patchDocument(path, fields) {
    const response = await fetch(`${firestoreBase}/${path}`, {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fields })
    });
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    return body;
}

async function readDocument(path) {
    const response = await fetch(`${firestoreBase}/${path}`);
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    return body;
}

test('Auth + Functions + Firestore: achievement evaluation trusts server facts and issues immutable receipts', async () => {
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Firestore emulator is required');
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Auth emulator is required');
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project);

    const alice = await signIn();
    await patchDocument(`users/${alice.uid}`, {
        achievements: { arrayValue: { values: [] } },
        email: { stringValue: 'private@example.test' },
        coins: { integerValue: '77' }
    });
    await patchDocument(`achievementFacts/${alice.uid}`, {
        totalGames: { integerValue: '10' },
        experience: { integerValue: '1000' },
        totalWins: { integerValue: '10' },
        perfectGames: { integerValue: '1' },
        level: { integerValue: '10' },
        unlockedIds: { arrayValue: { values: [] } }
    });

    const unauthenticated = await invoke(null);
    assert.equal(unauthenticated.body.error?.status, 'UNAUTHENTICATED');

    const forged = await invoke(alice, {
        operation: 'evaluate',
        payload: { totalGames: 999999, experience: 999999, achievementIds: ['level_ten'] }
    });
    assert.equal(forged.body.error?.status, 'INVALID_ARGUMENT');

    const first = await invoke(alice);
    assert.equal(first.status, 200, JSON.stringify(first.body));
    const result = first.body.result;
    assert.ok(result);
    assert.ok(result.newlyUnlocked.includes('first_quiz'));
    assert.ok(result.newlyUnlocked.includes('ten_quizzes'));
    assert.ok(result.newlyUnlocked.includes('first_win'));
    assert.ok(result.newlyUnlocked.includes('ten_wins'));
    assert.ok(result.newlyUnlocked.includes('perfect_score'));
    assert.ok(result.newlyUnlocked.includes('level_five'));
    assert.ok(result.newlyUnlocked.includes('level_ten'));
    assert.equal(result.alreadyUnlocked, false);

    const retry = await invoke(alice);
    assert.equal(retry.status, 200, JSON.stringify(retry.body));
    assert.deepEqual(retry.body.result.newlyUnlocked, []);
    assert.equal(retry.body.result.alreadyUnlocked, true);
    assert.deepEqual(retry.body.result.unlocked, result.unlocked);

    const user = await readDocument(`users/${alice.uid}`);
    const unlocked = user.fields.achievements.arrayValue.values.map(item => item.stringValue);
    assert.deepEqual(new Set(unlocked), new Set(result.unlocked));
    assert.equal(user.fields.email.stringValue, 'private@example.test');
    assert.equal(user.fields.coins.integerValue, '77');

    const facts = await readDocument(`achievementFacts/${alice.uid}`);
    const serverIds = facts.fields.unlockedIds.arrayValue.values.map(item => item.stringValue);
    assert.deepEqual(new Set(serverIds), new Set(result.newlyUnlocked));

    for (const id of result.newlyUnlocked) {
        const receipt = await readDocument(`achievementUnlockReceipts/${alice.uid}/unlocks/${id}`);
        assert.equal(receipt.fields.achievementId.stringValue, id);
    }
});
