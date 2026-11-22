# QuizHub V1 economy cutover audit — 2026-11-22

Status: source-level audit of `main`. This is not a production configuration inspection, security certification, migration, or approval to deploy.

## Executive summary

The V1 browser still uses direct Firestore writes for core economy operations. Trusted server implementations have advanced substantially and are exposed as Firebase callable previews, but the browser integration is opt-in for local emulators and the Functions fail closed outside the isolated `demo-quizhub` environment.

**Release gate: BLOCKED.** Do not describe the live economy as server-authoritative or anti-cheat protected. Do not deploy restrictive Firestore Rules or switch production clients to preview callables as part of this audit.

## Current production/browser path versus trusted preview

| Flow | Current browser / production behavior | Trusted implementation | Current release state |
|---|---|---|---|
| Profile bootstrap | `profile.js` creates `users/{uid}` from the browser, including initial 100 coins, XP/level, owned cosmetics and social arrays | Profile-create callable and Firestore adapter | Emulator-only preview; browser production path remains legacy |
| Classic quiz rewards | Shared `modes/base.js::persistResults()` computes rewards in browser and increments XP, weekly XP, coins and stats; Classic adds wins | Server question delivery, authenticated session service, idempotent claim and Firestore transaction | `quizSessionPreview` is emulator-only; production browser still writes directly |
| Duel / Survival / Time Trial | Mode-specific result UI delegates reward persistence to the shared browser base; mode-specific counters are supplied as client extra data | Server-owned mode sessions, canonical answer validation, mode reward claim and ledger entry | `quizModePreview` is emulator-only; production browser still uses legacy reward writer |
| Daily login | Browser reads eligibility/streak then increments coins and streak and writes `lastDailyClaim` | Transactional daily-login service, immutable claim receipt and `daily_login_reward` ledger entry | `dailyLoginRewardPreview` is emulator-only; production browser still uses legacy write |
| Shop purchases / bonuses | Browser reads price/balance, then writes ownership/equipment and decrements coins; bonus expiry is client-derived | Catalog-backed transactional purchase service, idempotency receipt and `shop_purchase` ledger entry | `shopPurchasePreview` is emulator-only; production browser still uses legacy write |
| Cosmetic equip | Browser updates equipped cosmetic directly | Server-side ownership-checked equip operation exists | Emulator-only shop callable; production remains legacy |
| Achievements | Browser evaluates local profile state and writes the achievements array | Server-maintained achievement facts, unlock receipts and `achievement_unlock` ledger events | `achievementUnlockPreview` is emulator-only; production browser still uses legacy evaluation/write |
| Daily competitive prizes | No confirmed production client claim flow in this audit | A backend `daily-prize-service` contract exists | No exported callable / ledger integration verified; treat as NOT RELEASE-READY |

## Findings

### E-01 — Browser economy writes remain authoritative in production

**Severity: Critical / release blocker**

The browser still writes balances and progression directly in these modules:

- `app/modules/quiz/modes/base.js`: XP, weekly XP, coins, completed quizzes and aggregate stats; individual modes add wins through `extraData`.
- `app/modules/profile/profile.js`: initial profile values including 100 coins and level 1.
- `app/modules/shop/shop.js`: cosmetic and bonus purchases, plus equipment changes.
- `app/modules/daily/daily.js`: daily login coins, streak and last-claim timestamp.
- `app/modules/achievements/achievements.js`: achievement IDs based on browser-visible profile facts.

The browser has access to the public question bank and computes score/rewards. Client validation and in-memory single-flight guards do not establish trusted scoring, cross-device idempotency or fraud prevention.

**Required action:** migrate each live browser flow to its authenticated server callable, verify receipts and UI state, then review/deploy Rules only after every dependent read/write is covered.

### E-02 — Trusted progression facts and visible profile level are not yet reconciled

**Severity: High / progression correctness; migration design required**

- `advanceAchievementFacts()` derives `achievementFacts.level` from server-owned cumulative XP using the V1 formula `floor(experience / 100) + 1`.
- Classic and mode reward claim services update `experience`, `weeklyExperience`, `coins`, wins and stats, while the Firestore quiz store's allowlisted `setUser()` projection does not include `level`.
- The legacy browser path separately calculates and writes `users/{uid}.level` after the reward write.
- Achievement facts deliberately start at zero and do not import legacy client-editable profile stats. Existing `users/{uid}.experience` and `level` therefore cannot be copied into the trusted baseline without a separately reviewed migration.
- `server/legacy-progression-audit.mjs` and its tests already provide a read-only legacy/trusted comparison. It intentionally returns `eligibleForAutomaticImport: false`; equality is not proof of provenance or complete ledger coverage.

A trusted claim could advance server-owned facts while the visible legacy profile level remained stale. PR #104 is now merged to `main` (`e77a0f9`) and resolves this for **new profiles only**: the trusted registration transaction creates `achievementFacts/{uid}` with zero XP, level 1 and `baselineTrusted: true`; Classic and all server-mode reward claims mirror the derived level into `users/{uid}.level` only when that marker is present, in the same transaction as the claim and ledger receipt. When public-profile sync is enabled, the projection receives the same level in that transaction. Existing legacy profiles without the marker retain their existing visible level; their client-editable XP/level are not imported or overwritten. Unit/emulator tests cover trusted baseline creation, 99 → 100 XP progression, legacy-level preservation and public projection sync. This remains emulator-preview code: production Rules must deny client writes to `achievementFacts`, and no production deployment/cutover has occurred. A reviewed baseline or explicit migration for existing accounts remains NOT DONE.

### E-03 — Daily competitive prize contract is not part of the deployed callable surface

**Severity: Medium / scope gate**

`server/daily-prize-service.mjs` contains a transaction-oriented reward contract, but this audit did not find a corresponding exported callable or browser invoker in `functions/index.mjs`. The service also does not create an account-ledger entry. Do not count this as a delivered V1 player feature until product scope, callable transport, idempotency, ledger behavior and UI are decided.

### E-04 — Ledger coverage is a preview contract, not yet a complete production history

The account ledger currently has server writers for quiz rewards, daily login rewards, shop purchases and achievement unlocks. Refunds are part of the event allowlist/schema but no complete refund user flow was verified. Daily competitive prizes are not yet represented by a callable/ledger flow.

The profile history UI is intentionally emulator-only and locked in Production until the server cutover is approved. This is the correct fail-closed behavior; do not remove the guard to make the screen appear live.

### E-05 — Firestore Rules and private/public profile separation remain independent blockers

The repository's economy security documentation records that no reviewed production Rules file or privacy-safe public/private schema split is committed. Leaderboards, friend discovery and public profiles currently depend on data in the user document. Firestore Rules cannot hide individual fields within a readable document.

Do not add owner-only Rules to `users/{uid}` until those cross-user reads and social operations have been migrated to an explicit public profile / relationship model and tested with two Auth users.

## Required V1 migration sequence

1. **Close the progression contract:** shared level formula and atomic sync for trusted new-account baselines are implemented in the pending preview PR; legacy-account baseline review, complete concurrent-session evidence and production Rules remain release gates.
2. **Complete trusted profile bootstrap:** migrate new-account creation without allowing initial coin resets or losing legacy fields.
3. **Cut over quiz modes:** move Classic, Duel, Survival and Time Trial browser start/answer/resume/claim to authenticated callable receipts; ensure client cannot submit score, XP, coins, multipliers or answer keys.
4. **Cut over shop:** server-owned catalog price, atomic balance/ownership mutation, stable operation IDs, duplicate retry behavior and owned-item equip validation.
5. **Cut over daily login:** server-owned UTC eligibility/streak and immutable idempotent claim receipt.
6. **Cut over achievements:** use server-maintained facts; define a safe baseline/migration for existing users before trusting achievement history.
7. **Decide daily competitive prizes and refunds:** either explicitly exclude them from V1 or implement their full callable, receipt, ledger and UI flows.
8. **Finish ledger history:** validate every event source, add missing event types only when backed by a real operation, and run browser acceptance on emulator accounts.
9. **Inventory all reads/writes and design privacy-safe profile/social paths.**
10. **Only then** prepare reviewed Rules, indexes, production Functions/client deployment, monitoring and rollback plan. Production deployment requires explicit owner approval.

## Test gates

- Level threshold crossing (99 → 100 XP), multi-level grants, no XP grant, overflow and duplicate receipt.
- Same session/operation retry, conflicting idempotency-key reuse and concurrent devices.
- Forged UID, score, XP, coins, win counters, multipliers, timestamps and extra request fields.
- All four quiz modes: valid scoring, timeout/expiry, answer replay, cross-user session access and exactly-once reward.
- Shop stale balance, simultaneous purchases, duplicate operation ID, owned item and bonus expiry.
- Daily login same-day retry, UTC midnight, missed-day streak reset and concurrent claims.
- Achievement baseline, duplicate unlock and facts/profile consistency.
- Ledger balance deltas equal the corresponding transaction receipt; no missing or duplicate entries.
- Two-user and anonymous Firestore Rules attacks after a reviewed Rules file exists.
- Browser acceptance for existing accounts, new accounts, mobile layout, offline/retry and two devices.

## Explicit non-actions

- No Production Firebase reads/writes or data exports.
- No Firestore Rules/index/Functions deployment.
- No IAM changes, migration, backfill or user balance adjustment.
- No removal of emulator-only guards or Production client cutover.
- No assertion that the live economy is currently secure or anti-cheat protected.


## 2026-11-22 — Shop callable staging

- PR #105 completed browser preview retry-key persistence and passed all three CI workflows.
- A separate `shopPurchase` callable source export is now staged on the feature branch. It delegates to the same authenticated, server-priced Firestore transaction service as the emulator-only preview.
- The emulator integration suite is redirected to exercise the staged callable contract end-to-end.
- This does **not** mean the callable is deployed. The browser still uses legacy direct Firestore writes outside the explicit local preview.
- Production Rules/indexes review, Functions deployment, client cutover, migration and rollback plan remain open gates. No live production data or configuration was touched.


## 2026-11-22 — Staged shop callable merged

- PR #106 merged to `main` as `38f2487`; all three CI workflows passed on the final head.
- The staged `shopPurchase` export is covered by an end-to-end Auth + Functions + Firestore Emulator test. The separate emulator-only preview guard remains intact.
- Production deployment, browser client migration, Rules/index review, rollback plan and owner-approved cutover remain NOT DONE. The current browser production path still writes shop changes directly to Firestore.


## 2026-11-22 — Production shop browser transport preparation

- Added an authenticated browser transport for the staged `shopPurchase` callable with a strict operation/payload allowlist.
- The local emulator preview and production transport now share the same payload validator.
- Tests verify the production callable name, signed-in requirement and rejection of client-supplied prices, UIDs, bonus duration/effect and malformed item IDs.
- The transport is deliberately not connected to the live shop UI. Production continues using legacy direct Firestore writes until the callable is deployed and the coordinated client + Rules migration is reviewed and approved.
