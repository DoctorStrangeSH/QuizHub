import test from 'node:test';
import assert from 'node:assert/strict';
import { createFirebaseFriendInvoker } from '../app/modules/friends/firebase-friend-invoker.js';

function setup({ hostname = 'localhost', search = '?firebaseEmulator=1&friendshipPreview=1', projectId = 'demo-quizhub', user = { uid: 'alice', isAnonymous: false } } = {}) {
    const calls = [];
    const auth = { app: { options: { projectId } }, currentUser: user };
    const functions = { id: 'functions' };
    const callable = async payload => { calls.push(payload); return { data: { status: 'updated' } }; };
    const invoke = createFirebaseFriendInvoker({
        auth,
        getFunctions: (...args) => (calls.push(['getFunctions', ...args]), functions),
        connectFunctionsEmulator: (...args) => calls.push(['connect', ...args]),
        httpsCallable: (...args) => (calls.push(['httpsCallable', ...args]), callable),
        location: { hostname, search }
    });
    return { invoke, calls };
}

test('friend invoker connects only to local demo emulator with explicit opt-in', async () => {
    const { invoke, calls } = setup();
    await invoke({ operation: 'send', targetUid: 'bob' });
    assert.deepEqual(calls[0], ['getFunctions', { options: { projectId: 'demo-quizhub' } }, 'europe-west1']);
    assert.deepEqual(calls[1], ['connect', { id: 'functions' }, '127.0.0.1', 5001]);
    assert.deepEqual(calls[2], ['httpsCallable', { id: 'functions' }, 'friendRelationshipPreview']);
    assert.deepEqual(calls[3], { operation: 'send', targetUid: 'bob' });
    for (const options of [
        { hostname: 'quizhub.example' },
        { search: '?firebaseEmulator=1' },
        { projectId: 'quizhub-e65f5' },
        { user: null },
        { user: { uid: 'guest', isAnonymous: true } }
    ]) assert.throws(() => setup(options), /FRIENDSHIP_PREVIEW_EMULATOR_REQUIRED|SIGNED_IN_ACCOUNT_REQUIRED/);
});

test('friend invoker rejects forged fields, invalid target, self target and unknown operation', async () => {
    const { invoke, calls } = setup();
    for (const request of [
        { operation: 'send', targetUid: 'bob', actorUid: 'victim' },
        { operation: 'send', targetUid: 'bad/id' },
        { operation: 'send', targetUid: 'alice' },
        { operation: 'admin', targetUid: 'bob' },
        ['send', 'bob']
    ]) await assert.rejects(invoke(request), /INVALID_FRIENDSHIP_REQUEST/);
    assert.equal(calls.filter(x => !Array.isArray(x)).length, 0);
});
