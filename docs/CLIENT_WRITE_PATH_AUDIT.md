# QuizHub — audit of active client-side writes

**Status:** V1 release blocker / source audit  
**Branch reviewed:** `main`  
**Date:** 2026-11-21

This audit distinguishes working trusted-service previews from the actual default browser path. A server implementation or emulator test is not production protection until the production client uses it and deployed Rules prevent bypass writes.

## Findings

| Area | Default browser behavior on `main` | Trusted path status | Risk / required V1 action |
|---|---|---|---|
| Quiz rewards | `app/modules/quiz/modes/base.js` calls `updateDoc(users/{uid})` with client-computed XP, weekly XP, coins, quiz count and stats; then may write level separately. | Server quiz services exist; callable exports are emulator-only. | Critical: migrate every reward-bearing mode to server-owned sessions and receipts; remove direct economy writes only after compatible client cutover. |
| Shop purchases | `app/modules/shop/shop.js` reads the user balance then directly writes owned cosmetics, equipped item, bonus state and coin decrement. | Shop callable preview is activated only for local emulator preview. | Critical: production purchase/equip must use transactional trusted endpoints; prevent negative balance, duplicate purchase and ownership spoofing. |
| Achievements | `app/modules/achievements/achievements.js` evaluates achievements from browser-visible stats/profile and directly updates `achievements`. | Server achievement preview exists and is emulator-only, based on server-maintained facts. | High: move eligibility and unlock receipt to trusted backend; do not accept browser-supplied achievement IDs. |
| Friendships | `app/modules/friends/friends.js` uses direct `updateDoc` calls against both users' documents for send/accept/decline/cancel/remove unless a local emulator preview flag is enabled. | Friend callable preview is local-emulator-only. | Critical: production browser still has a legacy direct-write path. Migrate all friendship transitions to trusted transactional endpoint before tightening Rules. |
| Chat messages | `app/modules/chat/chat.js` uses direct `addDoc`, `updateDoc` and reaction-map writes for normal chat; trusted transport is used only in preview-chat flow. | Send/history/mutation/reaction/read-receipt/unread callables are emulator-only. | Critical: production chat remains on direct Firestore operations. Migrate all read/write paths and preserve paging, reply, edit/delete, reactions and read state. |
| Profile creation | `app/modules/profile/profile.js` calls direct `setDoc(users/{uid})` by default; callable path requires local emulator preview flag. | Profile-create callable is emulator-only. | High: coordinate nickname claims, UID continuity and existing profile compatibility before switching. |
| Presence | `app/modules/chat/chat.js` writes `online/{uid}` directly. | No production presence migration confirmed in this source audit. | Review exact Rules and decide whether presence remains client-owned with strict owner-only constraints or moves to a trusted path. |

## Interpretation

- The preview switches are deliberately restricted to localhost/127.0.0.1 plus explicit query flags such as `firebaseEmulator=1` and feature-specific preview flags.
- Those switches do not make the production app use the trusted endpoints.
- The exported callable functions also reject requests unless the project is `demo-quizhub` and all required emulator markers are present.
- The current deployed Firestore Rules are unknown. Therefore this source audit does not assert which direct writes currently succeed or fail in Production.
- Client-side validation, hidden buttons, UI preview flags and projection allowlists are not authorization boundaries.

## Required migration order

1. Obtain the exact deployed Firestore Rules and index exports, Auth configuration and approved production backup evidence (Stage 0).
2. Map each existing Firestore document/field and query to its intended owner/participant permissions.
3. Complete trusted endpoint contracts and emulator tests for every mutation and read path.
4. Add production client transports behind explicit, reversible feature gates. Test the entire flow with two disposable accounts, retries, concurrency, offline recovery and existing-account data.
5. Prepare a coordinated Rules + client cutover. Avoid a state where new Rules block the currently published client.
6. Verify data preservation and rollback in a disposable environment.
7. Obtain explicit owner approval, then schedule production deployment. Do not deploy during this audit.

## Safety boundary

No production Rules, Functions, indexes, Auth settings, user documents, chat documents, economy values or feature flags were changed by this audit.


## Addendum — daily login and receipt preservation (2026-11-21)

The first pass omitted one active default-path mutation: `app/modules/daily/daily.js` directly increments `users/{uid}.coins` and `dailyStreak`, and writes `lastDailyClaim`. The trusted daily-login callable is used only when the explicit localhost emulator preview flags are enabled. This is a high-priority economy release blocker and must be migrated with the same idempotency guarantees as quiz rewards and shop purchases.

The repository-derived migration inventory also omitted two server-side idempotency collections: `dailyLoginClaims/{date}/users/{uid}` and `shopPurchaseRequests/{uid}/requests/{operationId}`. Both are now included as protected collections so backup/preservation validation cannot silently omit their receipts if populated.


## Addendum — UTC availability fix merged (2026-11-21)

- PR #85 aligns the browser's daily-claim availability date comparison with the server's UTC date key and hardens timestamp normalization.
- PR #86 adds authenticated browser acceptance against isolated Firebase emulators, including idempotent retry and the two offset-sensitive local calendar cases: UTC-10 can expose a premature local-day claim; UTC+14 can delay a claim after UTC midnight.
- All three required workflows passed on the final PR #86 head, including the network/browser emulator suite, emulator backup snapshot capture, and server-owned session Rules denial.
- These changes correct the display/availability decision and validate the existing emulator callable. They do **not** switch the normal Production reward mutation: the default browser path still directly writes coins, streak and last-claim timestamp. The callable remains emulator-only.
