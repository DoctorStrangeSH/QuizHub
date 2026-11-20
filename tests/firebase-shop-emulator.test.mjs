import assert from 'node:assert/strict';
import test from 'node:test';

const project = 'demo-quizhub';
const authBase = 'http://127.0.0.1:9099';
const callableUrl = `http://127.0.0.1:5001/${project}/europe-west1/shopPurchasePreview`;
const firestoreBase = `http://127.0.0.1:8080/v1/projects/${project}/databases/(default)/documents`;

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

async function invoke(user, operation, payload) {
    const response = await fetch(callableUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ data: { operation, payload } })
    });
    return { status: response.status, body: await response.json() };
}

async function seedProfile(uid, fields) {
    const response = await fetch(`${firestoreBase}/users/${encodeURIComponent(uid)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fields: {
            coins: { integerValue: String(fields.coins) },
            ownedThemes: { arrayValue: { values: [{ stringValue: 'theme_default' }] } },
            ownedFrames: { arrayValue: { values: [{ stringValue: 'frame_default' }] } },
            ownedParticles: { arrayValue: { values: [{ stringValue: 'particles_default' }] } },
            email: { stringValue: 'private@example.test' }
        } })
    });
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
}

async function readProfile(uid) {
    const response = await fetch(`${firestoreBase}/users/${encodeURIComponent(uid)}`);
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    return {
        coins: Number(body.fields?.coins?.integerValue ?? 0),
        ownedFrames: (body.fields?.ownedFrames?.arrayValue?.values ?? []).map(x => x.stringValue),
        equippedFrame: body.fields?.equippedFrame?.stringValue,
        email: body.fields?.email?.stringValue
    };
}

test('Auth + Functions + Firestore: shop purchase and equip are server-authoritative and idempotent', async () => {
    for (const host of ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST']) {
        assert.ok(process.env[host], `${host} is required; never connect this test to production`);
    }
    assert.equal(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT, project);

    const alice = await signInGuest();
    await seedProfile(alice.uid, { coins: 400 });

    const forged = await invoke(alice, 'purchase', {
        itemId: 'frame_gold', operationId: 'shop_purchase_0001', price: 1, uid: 'victim'
    });
    assert.equal(forged.body.error?.status, 'INVALID_ARGUMENT');

    const first = await invoke(alice, 'purchase', {
        itemId: 'frame_gold', operationId: 'shop_purchase_0001'
    });
    assert.equal(first.status, 200, JSON.stringify(first.body));
    assert.equal(first.body.result?.coinsSpent, 300);
    assert.equal(first.body.result?.balance, 100);
    assert.equal(first.body.result?.alreadyPurchased, false);

    const retry = await invoke(alice, 'purchase', {
        itemId: 'frame_gold', operationId: 'shop_purchase_0001'
    });
    assert.equal(retry.status, 200, JSON.stringify(retry.body));
    assert.equal(retry.body.result?.alreadyPurchased, true);
    assert.equal(retry.body.result?.balance, 100);

    const profile = await readProfile(alice.uid);
    assert.equal(profile.coins, 100);
    assert.deepEqual(profile.ownedFrames, ['frame_default', 'frame_gold']);
    assert.equal(profile.email, 'private@example.test');

    const equip = await invoke(alice, 'equip', { itemId: 'frame_gold' });
    assert.equal(equip.status, 200, JSON.stringify(equip.body));
    assert.equal(equip.body.result?.equipped, true);
    assert.equal((await readProfile(alice.uid)).equippedFrame, 'frame_gold');

    const notOwned = await invoke(alice, 'equip', { itemId: 'theme_neon' });
    assert.equal(notOwned.body.error?.status, 'FAILED_PRECONDITION');

    const insufficient = await invoke(alice, 'purchase', {
        itemId: 'theme_neon', operationId: 'shop_purchase_0002'
    });
    assert.equal(insufficient.body.error?.status, 'FAILED_PRECONDITION');
    assert.equal((await readProfile(alice.uid)).coins, 100);

    const reused = await invoke(alice, 'purchase', {
        itemId: 'theme_neon', operationId: 'shop_purchase_0001'
    });
    assert.equal(reused.body.error?.status, 'FAILED_PRECONDITION');
    assert.equal((await readProfile(alice.uid)).coins, 100);
});
