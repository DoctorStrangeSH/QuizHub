# QuizHub V1 economy cutover audit — 2026-11-22

Status: source-level audit of \`main\`. This is not a production configuration inspection, security certification, migration, or approval to deploy.

## Executive summary

The V1 browser still uses direct Firestore writes for core economy operations. Trusted server implementations have advanced substantially and are exposed as Firebase callable previews, but the browser integration is opt-in for local emulators and the Functions fail closed outside the isolated \`demo-quizhub\` environment.

**Release gate: BLOCKED.** Do not describe the live economy as server-authoritative or anti-cheat protected. Do not deploy restrictive Firestore Rules or switch production clients to preview callables as part of this audit.

## Current production/browser path versus trusted preview

| Flow | Current browser / production behavior | Trusted implementation | Current release state |
|---|---|---|---|
| Profile bootstrap | \`profile.js\` creates \`users/{uid}\` from the browser, including initial 100 coins, XP/level, owned cosmetics and social arrays | Profile-create callable and Firestore adapter | Emulator-only preview; browser production path remains legacy |
| Classic quiz rewards | Shared \`modes/base.js::persistResults()\` computes rewards in browser and increments XP, weekly XP, coins and stats; Classic adds wins | Server question delivery, authenticated session service, idempotent claim and Firestore transaction | \`quizSessionPreview\` is emulator-only; production browser still writes directly |
| Duel / Survival / Time Trial | Mode-specific result UI delegates reward persistence to the shared browser base; mode-specific counters are supplied as client extra data | Server-owned mode sessions, canonical answer validation, mode reward claim and ledger entry | \`quizModePreview\` is emulator-only; production browser still uses legacy reward writer |
| Daily login | Browser reads eligibility/streak then increments coins and streak and writes \`lastDailyClaim\` | Transactional daily-login service, immutable claim receipt and \`daily_login_reward\` ledger entry | \`dailyLoginRewardPreview\` is emulator-only; production browser still uses legacy write |
| Shop purchases / bonuses | Browser reads price/balance, then writes ownership/equipment and decrements coins; bonus expiry is client-derived | Catalog-backed transactional purchase service, idempotency receipt and \`shop_purchase\` ledger entry | \`shopPurchasePreview\` is emulator-only; production browser still uses legacy write |
| Cosmetic equip | Browser updates equipped cosmetic directly | Server-side ownership-checked equip operation exists | Emulator-only shop callable; production remains legacy |
| Achievements | Browser evaluates local profile state and writes the achievements array | Server-maintained achievement facts, unlock receipts and \`achievement_unlock\` ledger events | \`achievementUnlockPreview\` is emulator-only; production browser still uses legacy evaluation/write |
| Daily competitive prizes | No confirmed production client claim flow in this audit | A backend \`daily-prize-service\` contract exists | No exported callable / ledger integration verified; treat as NOT RELEASE-READY |

## Findings

### E-01 — Browser economy writes remain authoritative in production

**Severity: Critical / release blocker**

The browser still writes balances and progression directly in these modules:

- \`app/modules/quiz/modes/base.js\`: XP, weekly XP, coins, completed quizzes and aggregate stats; individual modes add wins through \`extraData\`.
- \`app/modules/profile/profile.js\`: initial profile values including 100 coins and level 1.
- \`app/modules/shop/shop.js\`: cosmetic and bonus purchases, plus equipment changes.
- \`app/modules/daily/daily.js\`: daily login coins, streak and last-claim timestamp.
- \`app/modules/achievements/achievements.js\`: achievement IDs based on browser-visible profile facts.

The browser has access to the public question bank and computes score/rewards. Client validation and in-memory single-flight guards do not establish trusted scoring, cross-device idempotency or fraud prevention.

**Required action:** migrate each live browser flow to its authenticated server callable, verify receipts and UI state, then review/deploy Rules only after every dependent read/write is covered.

### E-02 — Server-owned level is computed but not synchronized to the user profile

**Severity: High / progression correctness**

- \`advanceAchievementFacts()\` derives \`achievementFacts.level\` from server-owned cumulative XP using the V1 formula \`floor(experience / 100) + 1\`.
- Classic and mode reward claim services update \`experience\`, \`weeklyExperience\`, \`coins\`, wins and stats.
- The Firestore quiz store's allowlisted \`setUser()\` projection does not include \`level\`.
- The browser legacy path separately calculates and writes \`users/{uid}.level\` after the reward write.

Therefore, if the trusted quiz claim path is used, server-owned achievement facts can advance while the profile's visible \`level\` remains stale. This must be resolved before any production cutover. The fix must update level atomically with the XP/balance/session receipt, preserve unrelated profile fields and cover Classic plus Duel/Survival/Time Trial.

### E-03 — Daily competitive prize contract is not part of the deployed callable surface

**Severity: Medium / scope gate**

\`server/daily-prize-service.mjs\` contains a transaction-oriented reward contract, but this audit did not find a corresponding exported callable or browser invoker in \`functions/index.mjs\`. The service also does not create an account-ledger entry. Do not count this as a delivered V1 player feature until product scope, callable transport, idempotency, ledger behavior and UI are decided.

### E-04 — Ledger coverage is a preview contract, not yet a complete production history

The account ledger currently has server writers for quiz rewards, daily login rewards, shop purchases and achievement unlocks. Refunds are part of the event allowlist/schema but no complete refund user flow was verified. Daily competitive prizes are not yet represented by a callable/ledger flow.

The profile history UI is intentionally emulator-only and locked in Production until the server cutover is approved. This is the correct fail-closed behavior; do not remove the guard to make the screen appear live.

### E-05 — Firestore Rules and private/public profile separation remain independent blockers

The repository's economy security documentation records that no reviewed production Rules file or privacy-safe public/private schema split is committed. Leaderboards, friend discovery and public profiles currently depend on data in the user document. Firestore Rules cannot hide individual fields within a readable document.

Do not add owner-only Rules to \`users/{uid}\` until those cross-user reads and social operations have been migrated to an explicit public profile / relationship model and tested with two Auth users.

## Required V1 migration sequence

1. **Close the progression contract:** define one shared level formula and update level atomically in Classic and all server-mode reward claims; test threshold crossings, repeated claims and concurrent sessions.
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
