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
