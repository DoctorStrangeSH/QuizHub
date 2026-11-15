import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import questionBank from '../app/data/questions/index.js';
import { buildQuestionCatalog } from '../server/question-delivery.mjs';
import { createServerDailyChallenge } from '../server/daily-challenge-service.mjs';
import { createAuthenticatedDailyChallengeHandler } from '../server/authenticated-daily-challenge-handler.mjs';
import { createDailyFirestoreStore } from '../server/daily-firestore-store.mjs';
import { createDailyCallableAdapter } from '../server/firebase-daily-callable-adapter.mjs';

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
