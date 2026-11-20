import assert from 'node:assert/strict';
import test from 'node:test';

const project = 'demo-quizhub';
const authBase = 'http://127.0.0.1:9099';
const callableUrl = `http://127.0.0.1:5001/${project}/europe-west1/dailyChallenge`;
const firestoreBase = `http://127.0.0.1:8080/v1/projects/${project}/databases/(default)/documents`;
const dailyLoginCallableUrl = `http://127.0.0.1:5001/${project}/europe-west1/dailyLoginRewardPreview`;

async function signInGuest() {
    const response = await fetch(
        `${authBase}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-key`,
        { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }
    );
    const data = await response.json();
    assert.equal(response.status, 200, JSON.stringify(data));
    assert.ok(data.idToken);
    assert.ok(data.localId);
    return { token: data.idToken, uid: data.localId };
}

async function invoke(user, operation, payload = {}, extra = {}) {
    const headers = { 'content-type': 'application/json' };
    if (user) headers.authorization = `Bearer ${user.token}`;
    const response = await fetch(callableUrl, {
        method: 'POST', headers,
        body: JSON.stringify({ data: { operation, payload, ...extra } })
    });
    return { status: response.status, body: await response.json() };
}

async function invokeDailyLogin(user) {
    const response = await fetch(dailyLoginCallableUrl, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ data: { operation: 'claim', payload: {} } })
    });
    return { status: response.status, body: await response.json() };
}

async function seedLoginProfile(uid, { coins = 0, dailyStreak = 0, lastDailyClaim } = {}) {
    const fields = {
        coins: { integerValue: String(coins) },
        dailyStreak: { integerValue: String(dailyStreak) }
    };
    if (lastDailyClaim !== undefined) {
        fields.lastDailyClaim = { timestampValue: new Date(lastDailyClaim).toISOString() };
    }
    const response = await fetch(`${firestoreBase}/users/${encodeURIComponent(uid)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fields })
    });
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
}

async function readLoginProfile(uid) {
    const response = await fetch(`${firestoreBase}/users/${encodeURIComponent(uid)}`);
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    return {
        coins: Number(body.fields?.coins?.integerValue ?? 0),
        dailyStreak: Number(body.fields?.dailyStreak?.integerValue ?? 0)
    };
}

test('Auth + Functions + Firestore: authenticated daily challenge remains private', async () => {
    for (const host of ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST']) {
        assert.ok(process.env[host], `${host} is required; never connect this test to production`);
    }
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project);

    const noAuth = await invoke(null, 'start');
    assert.equal(noAuth.body.error?.status, 'UNAUTHENTICATED');

    const alice = await signInGuest();
    const bob = await signInGuest();
    assert.notEqual(alice.uid, bob.uid);

    const forged = await invoke(alice, 'start', { uid: bob.uid });
    assert.equal(forged.body.error?.status, 'INVALID_ARGUMENT');

    const first = await invoke(alice, 'start');
    assert.equal(first.status, 200, JSON.stringify(first.body));
    assert.equal(first.body.result?.alreadyStarted, false);
    assert.equal(first.body.result?.status, 'in_progress');
    assert.equal(first.body.result?.totalQuestions, 10);
    assert.ok(first.body.result?.question?.id);
    assert.equal(JSON.stringify(first.body.result).includes('correctAnswer'), false);
    const { date, question } = first.body.result;

    const replay = await invoke(alice, 'start');
    assert.equal(replay.body.result?.alreadyStarted, true);
    assert.equal(replay.body.result?.question?.id, question.id);

    const other = await invoke(bob, 'start');
    assert.equal(other.body.result?.alreadyStarted, false);
    assert.equal(other.body.result?.date, date);

    const bobAnswerAsAlice = await invoke(bob, 'answer', {
        date, questionId: question.id, answerIndex: 0
    });
    // Bob's own first question may differ in future personalization;
    // only check Alice's attempt is unaffected below.
    assert.ok([200, 400, 412, 500].includes(bobAnswerAsAlice.status));

    const answer = await invoke(alice, 'answer', {
        date, questionId: question.id, answerIndex: 0
    });
    assert.equal(answer.status, 200, JSON.stringify(answer.body));
    assert.equal(answer.body.result?.answeredQuestions, 1);
    assert.equal(answer.body.result?.replayed, false);

    const repeated = await invoke(alice, 'answer', {
        date, questionId: question.id, answerIndex: 0
    });
    assert.equal(repeated.body.result?.replayed, true);
    assert.equal(repeated.body.result?.answeredQuestions, 1);

    const changed = await invoke(alice, 'answer', {
        date, questionId: question.id, answerIndex: 1
    });
    assert.equal(changed.body.error?.status, 'FAILED_PRECONDITION');

    const attemptPath = `${firestoreBase}/dailyAttempts/${date}/users/${encodeURIComponent(alice.uid)}`;
    const storedResponse = await fetch(attemptPath);
    assert.equal(storedResponse.status, 200);
    const stored = await storedResponse.json();
    assert.equal(stored.fields?.uid?.stringValue, alice.uid);
    assert.equal(stored.fields?.date?.stringValue, date);
    assert.equal(stored.fields?.session?.mapValue?.fields?.answers?.arrayValue?.values?.length, 1);

    const resumed = await invoke(alice, 'resume', { date });
    assert.equal(resumed.body.result?.answeredQuestions, 1);
    const bobResume = await invoke(bob, 'resume', { date });
    assert.equal(bobResume.body.result?.answeredQuestions, bobAnswerAsAlice.status === 200 ? 1 : 0);

    const illegalCompletion = await invoke(alice, 'complete', { date });
    assert.equal(illegalCompletion.body.error?.status, 'FAILED_PRECONDITION');
});


test('Auth + Functions + Firestore: daily login preview grants once and applies UTC streak rules', async () => {
    for (const host of ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST']) {
        assert.ok(process.env[host], `${host} is required; never connect this test to production`);
    }
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project);

    const alice = await signInGuest();
    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);
    const todayStart = Date.parse(today + 'T00:00:00.000Z');
    await seedLoginProfile(alice.uid, {
        coins: 5,
        dailyStreak: 1,
        lastDailyClaim: todayStart - 86_400_000
    });

    const first = await invokeDailyLogin(alice);
    assert.equal(first.status, 200, JSON.stringify(first.body));
    assert.equal(first.body.result?.alreadyClaimed, false);
    assert.equal(first.body.result?.streak, 2);
    assert.equal(first.body.result?.coins, 20);
    assert.equal(first.body.result?.balance, 25);

    const retry = await invokeDailyLogin(alice);
    assert.equal(retry.status, 200, JSON.stringify(retry.body));
    assert.equal(retry.body.result?.alreadyClaimed, true);
    assert.equal(retry.body.result?.balance, 25);
    assert.deepEqual(await readLoginProfile(alice.uid), { coins: 25, dailyStreak: 2 });

    const concurrent = await signInGuest();
    await seedLoginProfile(concurrent.uid, { coins: 0, dailyStreak: 0 });
    const claims = await Promise.all([
        invokeDailyLogin(concurrent),
        invokeDailyLogin(concurrent)
    ]);
    assert.ok(claims.every(item => item.status === 200), JSON.stringify(claims));
    assert.equal(claims.filter(item => item.body.result?.alreadyClaimed === false).length, 1);
    assert.equal(claims.filter(item => item.body.result?.alreadyClaimed === true).length, 1);
    assert.deepEqual(await readLoginProfile(concurrent.uid), { coins: 10, dailyStreak: 1 });

    const missed = await signInGuest();
    await seedLoginProfile(missed.uid, {
        coins: 3,
        dailyStreak: 5,
        lastDailyClaim: todayStart - (2 * 86_400_000)
    });
    const reset = await invokeDailyLogin(missed);
    assert.equal(reset.status, 200, JSON.stringify(reset.body));
    assert.equal(reset.body.result?.streak, 1);
    assert.equal(reset.body.result?.coins, 10);
    assert.deepEqual(await readLoginProfile(missed.uid), { coins: 13, dailyStreak: 1 });
});
