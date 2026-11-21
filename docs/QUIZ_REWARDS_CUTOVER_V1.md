# Quiz Rewards V1 — trusted cutover audit

Date: 2026-11-21

## Scope

This document records the current boundary between the legacy browser reward path and the trusted Classic quiz-session preview. It is an implementation/release checklist, not approval to deploy or enable Production callables.

## Current verified paths

### Normal browser / Production path

- `app/modules/quiz/modes/base.js::persistResults()` calculates XP and coins from the browser's local score and calls `updateDoc(users/{uid})` directly.
- The browser reads active event multipliers from `app/modules/events/events-data.js`. Event rules currently depend on the player's local date, day of week and local hour.
- Classic adds win counters using browser-authored `increment()` fields. The browser then separately reads the profile and writes `level` from the displayed XP balance.
- This path remains the default when the local emulator preview flags are absent.

### Trusted Classic preview

- `quizSessionPreview` is exported from `functions/index.mjs` and is restricted to the isolated `demo-quizhub` Auth, Firestore and Functions emulators.
- The server selects canonical questions, keeps answer keys private, validates ordered answers, computes the score and atomically records a reward receipt with user updates.
- `claimSessionReward()` currently applies the base `calculateQuizRewards(score)` formula. It deliberately does not trust browser event multiplier values.
- The authenticated browser acceptance test `tests/firebase-classic-server-browser.test.mjs` completes ten questions through the real callable, claims once, retries and verifies the persisted balance/XP deltas.
- The server-owned achievement ledger `achievementFacts/{uid}` derives its own level from server-earned XP. The current reward adapter does not overwrite `users/{uid}.level`.

## Release gaps — do not silently bridge these

1. **Event multiplier parity.** The legacy client uses local-time event rules (weekend XP, Happy Hour coins, Night Owl, Monday Motivation and holiday multipliers). The trusted server currently awards base XP/coins only. Before cutover, choose and document a server-authoritative timezone policy and implement/test the same event schedule using server time. Never accept multipliers or reward totals from the browser.
2. **Legacy progression baseline.** `achievementFacts` starts at zero when no trusted facts document exists. Existing `users/{uid}.experience`, `level` and stats are legacy client-writable values and must not be imported as trusted facts without an audited baseline migration. Do not blindly copy `achievementFacts.level` into `users.level`: that could reset established players to level 1. A verified baseline migration must define how trusted facts and the profile level become consistent.
3. **Mode parity.** The trusted Classic session contract and the server-owned Survival/Time Trial/Duel contract are distinct. Do not route all modes through Classic scoring or claim a full-mode migration from Classic acceptance alone.
4. **Production Rules and deployment evidence.** Exact deployed Firestore Rules and indexes, Auth provider/domain settings, complete live collection inventory, and a verified recoverable Production backup/restore are still missing. The repository does not establish the deployed Rules source of truth.

## Required cutover sequence

1. Complete Stage 0 evidence and reconcile it with repository configuration.
2. Decide timezone semantics for event schedules; add deterministic server-clock tests at day/week/hour boundaries and compare base vs boosted rewards.
3. Define a versioned, auditable baseline for legacy XP, level, weekly XP, wins, stats and achievement state. Preserve every existing account field; resolve anomalous/negative/overflow values explicitly rather than coercing them.
4. Extend the trusted transaction to write the approved progression projection and reward receipt atomically. Preserve idempotency for concurrent/retried claims.
5. Run two-account authenticated browser acceptance for Classic, including event boundaries, same-session retries, simultaneous claims, reload/resume, existing profiles, and unchanged private profile fields.
6. Add reversible client feature gates and prepare a coordinated client + Rules cutover. Do not tighten Rules before the shipped client uses compatible trusted paths.
7. Obtain explicit owner approval before any Production deployment or data migration.

## Safety boundary

This audit changed no application code, tests, Firebase configuration, deployed Rules, Functions, indexes, Auth settings, live Firestore data, reward balances, or feature flags. All current trusted-callable browser acceptance is emulator-only.
