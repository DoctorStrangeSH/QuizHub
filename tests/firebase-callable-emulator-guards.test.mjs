import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const EXPECTED_PRODUCTION_CALLABLES = ['shopPurchase'];

const EXPECTED_PREVIEW_CALLABLES = [
    'accountLedgerHistoryPreviewCallable',
    'dailyChallenge',
    'quizSessionPreview',
    'profileCreatePreview',
    'profileTimeZonePreview',
    'quizModePreview',
    'shopPurchasePreview',
    'dailyLoginRewardPreview',
    'achievementUnlockPreview',
    'friendRelationshipPreview',
    'chatSendPreviewCallable',
    'chatHistoryPreviewCallable',
    'chatMessageMutationPreviewCallable',
    'chatReactionPreviewCallable',
    'chatReadReceiptPreviewCallable',
    'chatUnreadCountPreviewCallable'
];

test('every exported callable preview fails closed outside the isolated Firebase emulators', async () => {
    const source = await readFile(new URL('../functions/index.mjs', import.meta.url), 'utf8');
    const declarations = [...source.matchAll(/export const (\w+)\s*=\s*onCall\(/g)];

    const previewDeclarations = declarations.filter(match => EXPECTED_PREVIEW_CALLABLES.includes(match[1]));
    const productionDeclarations = declarations.filter(match => EXPECTED_PRODUCTION_CALLABLES.includes(match[1]));

    assert.deepEqual(
        declarations.map(match => match[1]).sort(),
        [...EXPECTED_PREVIEW_CALLABLES, ...EXPECTED_PRODUCTION_CALLABLES].sort(),
        'Update the preview/production allowlists whenever an exported callable is intentionally added or removed'
    );
    assert.equal(productionDeclarations.length, EXPECTED_PRODUCTION_CALLABLES.length);

    for (let index = 0; index < previewDeclarations.length; index++) {
        const declaration = previewDeclarations[index];
        const allIndex = declarations.findIndex(match => match.index === declaration.index);
        const end = declarations[allIndex + 1]?.index ?? source.length;
        const body = source.slice(declaration.index, end);
        const name = declaration[1];
        const label = 'Callable ' + name + ': ';

        assert.match(body, /GCLOUD_PROJECT\s*\|\|\s*process\.env\.GOOGLE_CLOUD_PROJECT/, label + 'project identity must be checked');
        assert.match(body, /===\s*'demo-quizhub'/, label + 'only the demo emulator project is allowed');
        assert.match(body, /process\.env\.FIRESTORE_EMULATOR_HOST/, label + 'Firestore Emulator must be active');
        assert.match(body, /process\.env\.FIREBASE_AUTH_EMULATOR_HOST/, label + 'Auth Emulator must be active');
        assert.match(body, /process\.env\.FUNCTIONS_EMULATOR/, label + 'Functions Emulator must be active');
        assert.match(body, /if\s*\(!emulatorProject\s*\|\|\s*!isolated\)/, label + 'missing fail-closed guard');
        assert.match(body, /new HttpsError\('failed-precondition'/, label + 'production invocation must be rejected');
    }
});


test('staged production shop callable delegates to the authenticated service without a preview-only guard', async () => {
    const source = await readFile(new URL('../functions/index.mjs', import.meta.url), 'utf8');
    const declaration = source.match(/export const shopPurchase\\s*=\\s*onCall\\(([\\s\\S]*?)\\);/);
    assert.ok(declaration, 'shopPurchase production callable must be exported');
    assert.match(declaration[1], /shopPreview\\(request\\)/);
    assert.doesNotMatch(declaration[1], /demo-quizhub|SHOP_PURCHASE_PREVIEW_DISABLED/);
});
