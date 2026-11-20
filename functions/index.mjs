import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import questionBank from '../app/data/questions/index.js';
import { buildQuestionCatalog } from '../server/question-delivery.mjs';
import { createServerDailyChallenge } from '../server/daily-challenge-service.mjs';
import { createAuthenticatedDailyChallengeHandler } from '../server/authenticated-daily-challenge-handler.mjs';
import { createDailyFirestoreStore } from '../server/daily-firestore-store.mjs';
import { createDailyCallableAdapter } from '../server/firebase-daily-callable-adapter.mjs';

import { createQuizFirestoreStore } from '../server/quiz-firestore-store.mjs';
import { createQuizService } from '../server/quiz-service.mjs';
import { createAuthenticatedQuizHandler } from '../server/authenticated-quiz-handler.mjs';
import { createQuizCallableAdapter } from '../server/firebase-quiz-callable-adapter.mjs';
import { createPlayerProfile } from '../server/profile-create.mjs';
import { createProfileCallableAdapter } from '../server/profile-create-callable-adapter.mjs';
import { createModeSessionService } from '../server/quiz-mode-session-service.mjs';
import { createAuthenticatedModeHandler } from '../server/authenticated-mode-handler.mjs';
import { createModeCallableAdapter } from '../server/firebase-mode-callable-adapter.mjs';
import { createShopPurchaseService } from '../server/shop-purchase-service.mjs';
import { createShopFirestoreStore } from '../server/shop-firestore-store.mjs';
import { createAuthenticatedShopHandler } from '../server/authenticated-shop-handler.mjs';
import { createShopCallableAdapter } from '../server/firebase-shop-callable-adapter.mjs';
import { createDailyLoginRewardService } from '../server/daily-login-reward-service.mjs';
import { createDailyLoginFirestoreStore } from '../server/daily-login-firestore-store.mjs';
import { createAuthenticatedDailyLoginHandler } from '../server/authenticated-daily-login-handler.mjs';
import { createDailyLoginCallableAdapter } from '../server/firebase-daily-login-callable-adapter.mjs';
import { createAchievementUnlockService } from '../server/achievement-unlock-service.mjs';
import { createAchievementFirestoreStore } from '../server/achievement-firestore-store.mjs';
import { createAuthenticatedAchievementHandler } from '../server/authenticated-achievement-handler.mjs';
import { createAchievementCallableAdapter } from '../server/firebase-achievement-callable-adapter.mjs';

if (!getApps().length) initializeApp();
const store = createDailyFirestoreStore(getFirestore());
const catalog = buildQuestionCatalog(questionBank);
const handle = createAuthenticatedDailyChallengeHandler(
    createServerDailyChallenge({ catalog, store })
);

// This is deliberately NOT connected to the existing practice UI yet.
// A future verified migration will enable ranked server sessions.
export const dailyChallenge = onCall({
    region: 'europe-west1',
    memory: '256MiB',
    timeoutSeconds: 30
}, createDailyCallableAdapter({ handle, HttpsError }));

// Emulator-only integration preview. This callable intentionally refuses every
// request in real Firebase projects, even from authenticated users, because
// the browser still exposes the answer key and production security rules have
// not been migrated. Do NOT remove this guard during routine deployment.
const quizPreview = createQuizCallableAdapter({
    handle: createAuthenticatedQuizHandler(
        createQuizService({ catalog, store: createQuizFirestoreStore(getFirestore()) })
    ),
    HttpsError
});
export const quizSessionPreview = onCall({
    region: 'europe-west1',
    memory: '256MiB',
    timeoutSeconds: 30
}, async request => {
    const emulatorProject = (process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT) === 'demo-quizhub';
    const isolated = Boolean(process.env.FIRESTORE_EMULATOR_HOST &&
        process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.FUNCTIONS_EMULATOR);
    if (!emulatorProject || !isolated) {
        throw new HttpsError('failed-precondition', 'QUIZ_PREVIEW_DISABLED');
    }
    return quizPreview(request);
});


// Preview of authenticated profile registration: only runs in the isolated
// Auth + Firestore + Functions emulators. Production browser registration is
// unchanged until legacy nickname claims and Firestore rules are migrated.
const profilePreview = createProfileCallableAdapter({
    create: args => createPlayerProfile(getFirestore(), args),
    HttpsError
});
export const profileCreatePreview = onCall({
    region: 'europe-west1',
    memory: '256MiB',
    timeoutSeconds: 30
}, async request => {
    const emulatorProject = (process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT) === 'demo-quizhub';
    const isolated = Boolean(process.env.FIRESTORE_EMULATOR_HOST &&
        process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.FUNCTIONS_EMULATOR);
    if (!emulatorProject || !isolated) {
        throw new HttpsError('failed-precondition', 'PROFILE_CREATE_PREVIEW_DISABLED');
    }
    return profilePreview(request);
});

const modeStore = createQuizFirestoreStore(getFirestore());
const modePreview = createModeCallableAdapter({
    handle: createAuthenticatedModeHandler({
        service: createModeSessionService({ catalog, store: modeStore }),
        store: modeStore
    }),
    HttpsError
});

// Server-owned Duel, Survival and Time Trial preview. Emulator-only until
// Firestore rules, migration and client cutover are explicitly approved.
export const quizModePreview = onCall({
    region: 'europe-west1',
    memory: '256MiB',
    timeoutSeconds: 30
}, async request => {
    const emulatorProject = (process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT) === 'demo-quizhub';
    const isolated = Boolean(process.env.FIRESTORE_EMULATOR_HOST &&
        process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.FUNCTIONS_EMULATOR);
    if (!emulatorProject || !isolated) {
        throw new HttpsError('failed-precondition', 'QUIZ_MODE_PREVIEW_DISABLED');
    }
    return modePreview(request);
});


// Shop purchase preview is isolated to the local Auth + Firestore + Functions
// emulators. Production remains disabled until the browser shop and Rules are
// migrated and owner acceptance is complete.
const shopPreview = createShopCallableAdapter({
    handle: createAuthenticatedShopHandler({
        service: createShopPurchaseService({ store: createShopFirestoreStore(getFirestore()) })
    }),
    HttpsError
});
export const shopPurchasePreview = onCall({
    region: 'europe-west1',
    memory: '256MiB',
    timeoutSeconds: 30
}, async request => {
    const emulatorProject = (process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT) === 'demo-quizhub';
    const isolated = Boolean(process.env.FIRESTORE_EMULATOR_HOST &&
        process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.FUNCTIONS_EMULATOR);
    if (!emulatorProject || !isolated) {
        throw new HttpsError('failed-precondition', 'SHOP_PURCHASE_PREVIEW_DISABLED');
    }
    return shopPreview(request);
});


// Daily login reward preview is emulator-only. The existing browser claim flow
// remains unchanged until authenticated acceptance and production Rules migration.
const dailyLoginPreview = createDailyLoginCallableAdapter({
    handle: createAuthenticatedDailyLoginHandler({
        service: createDailyLoginRewardService({
            store: createDailyLoginFirestoreStore(getFirestore())
        })
    }),
    HttpsError
});
export const dailyLoginRewardPreview = onCall({
    region: 'europe-west1',
    memory: '256MiB',
    timeoutSeconds: 30
}, async request => {
    const emulatorProject = (process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT) === 'demo-quizhub';
    const isolated = Boolean(process.env.FIRESTORE_EMULATOR_HOST &&
        process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.FUNCTIONS_EMULATOR);
    if (!emulatorProject || !isolated) {
        throw new HttpsError('failed-precondition', 'DAILY_LOGIN_PREVIEW_DISABLED');
    }
    return dailyLoginPreview(request);
});


// Achievement evaluation is a preview only. It consumes server-maintained
// achievementFacts, never progress supplied by the browser. Facts are not yet
// populated by trusted quiz finalization, so this does not unlock legacy stats.
const achievementPreview = createAchievementCallableAdapter({
    handle: createAuthenticatedAchievementHandler({
        service: createAchievementUnlockService({
            store: createAchievementFirestoreStore(getFirestore())
        })
    }),
    HttpsError
});
export const achievementUnlockPreview = onCall({
    region: 'europe-west1',
    memory: '256MiB',
    timeoutSeconds: 30
}, async request => {
    const emulatorProject = (process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT) === 'demo-quizhub';
    const isolated = Boolean(process.env.FIRESTORE_EMULATOR_HOST &&
        process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.FUNCTIONS_EMULATOR);
    if (!emulatorProject || !isolated) {
        throw new HttpsError('failed-precondition', 'ACHIEVEMENT_PREVIEW_DISABLED');
    }
    return achievementPreview(request);
});
