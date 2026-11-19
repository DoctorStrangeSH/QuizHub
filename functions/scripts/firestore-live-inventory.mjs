#!/usr/bin/env node
// Explicitly confirmed, read-only inventory for QuizHub's production Firestore.
// This script performs document reads and may incur read charges. It never writes.
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { collectFirestoreInventory } from '../../server/firestore-live-inventory.mjs';

const EXPECTED_PROJECT_ID = 'quizhub-e65f5';

function fail(message) {
    console.error(message);
    process.exitCode = 1;
}

if (process.env.QUIZHUB_CONFIRM_READ_ONLY_INVENTORY !== 'YES') {
    fail('Set QUIZHUB_CONFIRM_READ_ONLY_INVENTORY=YES to explicitly confirm read-only production reads.');
} else {
    const projectId = process.env.QUIZHUB_PROJECT_ID;
    if (projectId !== EXPECTED_PROJECT_ID) {
        fail('QUIZHUB_PROJECT_ID must exactly equal ' + EXPECTED_PROJECT_ID + '. No other project is allowed.');
    } else {
        const maxDocuments = Number(process.env.QUIZHUB_INVENTORY_MAX_DOCS ?? 5000);
        const maxDepth = Number(process.env.QUIZHUB_INVENTORY_MAX_DEPTH ?? 8);
        let app;
        try {
            app = getApps().find(candidate => candidate.name === 'quizhub-read-only-inventory') ??
                initializeApp({
                    credential: applicationDefault(),
                    projectId: EXPECTED_PROJECT_ID
                }, 'quizhub-read-only-inventory');

            const db = getFirestore(app);
            const result = await collectFirestoreInventory(db, { maxDocuments, maxDepth });
            console.log(JSON.stringify({
                projectId: EXPECTED_PROJECT_ID,
                databaseId: '(default)',
                generatedAt: new Date().toISOString(),
                ...result
            }, null, 2));
        } catch (error) {
            fail('Inventory aborted without a complete report: ' + (error?.message ?? 'UNKNOWN_ERROR'));
        } finally {
            if (app) await app.delete().catch(() => {});
        }
    }
}
