import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const EXPECTED_PREVIEW_CALLABLES = [
    'dailyChallenge',
    'quizSessionPreview',
    'profileCreatePreview',
    'quizModePreview',
    'shopPurchasePreview',
    'dailyLoginRewardPreview',
    'achievementUnlockPreview'
];

test('every exported callable preview fails closed outside the isolated Firebase emulators', async () => {
    const source = await readFile(new URL('../functions/index.mjs', import.meta.url), 'utf8');
    const declarations = [...source.matchAll(/export const (\w+)\s*=\s*onCall\(/g)];

    assert.deepEqual(
        declarations.map(match => match[1]).sort(),
        [...EXPECTED_PREVIEW_CALLABLES].sort(),
        'Update this allowlist whenever an exported callable is intentionally added or removed'
    );

    for (let index = 0; index < declarations.length; index++) {
        const declaration = declarations[index];
        const end = declarations[index + 1]?.index ?? source.length;
        const body = source.slice(declaration.index, end);
        const name = declaration[1];

        assert.match(body, /GCLOUD_PROJECT\s*\|\|\s*process\.env\.GOOGLE_CLOUD_PROJECT/, \`\${name}: project identity must be checked\`);
        assert.match(body, /===\s*'demo-quizhub'/, \`\${name}: only the demo emulator project is allowed\`);
        assert.match(body, /process\.env\.FIRESTORE_EMULATOR_HOST/, \`\${name}: Firestore Emulator must be active\`);
        assert.match(body, /process\.env\.FIREBASE_AUTH_EMULATOR_HOST/, \`\${name}: Auth Emulator must be active\`);
        assert.match(body, /process\.env\.FUNCTIONS_EMULATOR/, \`\${name}: Functions Emulator must be active\`);
        assert.match(body, /if\s*\(!emulatorProject\s*\|\|\s*!isolated\)/, \`\${name}: missing fail-closed guard\`);
        assert.match(body, /new HttpsError\('failed-precondition'/, \`\${name}: production invocation must be rejected\`);
    }
});
