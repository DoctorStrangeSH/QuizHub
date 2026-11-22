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

1. **Event multiplier parity.** The server now resolves active V1 boosts from the trusted callable timestamp and a validated IANA timezone stored on the private user profile. New profile creation records the browser's detected timezone as a preference; the public profile projection excludes it. Existing profiles without a timezone use UTC. This fallback is deterministic but may differ from the player's former local-time schedule, so an explicit settings/backfill path for existing users is still required before Production cutover. Never accept multipliers or reward totals from the browser.
2. **Legacy progression baseline.** `achievementFacts` starts at zero when no trusted facts document exists. Existing `users/{uid}.experience`, `level` and stats are legacy client-writable values and must not be imported as trusted facts without an audited baseline migration. Do not blindly copy `achievementFacts.level` into `users.level`: that could reset established players to level 1. A verified baseline migration must define how trusted facts and the profile level become consistent.
3. **Mode parity.** The trusted Classic session contract and the server-owned Survival/Time Trial/Duel contract are distinct. Do not route all modes through Classic scoring or claim a full-mode migration from Classic acceptance alone.
4. **Production Rules and deployment evidence.** Exact deployed Firestore Rules and indexes, Auth provider/domain settings, complete live collection inventory, and a verified recoverable Production backup/restore are still missing. The repository does not establish the deployed Rules source of truth.

## Required cutover sequence

1. Complete Stage 0 evidence and reconcile it with repository configuration.
2. The owner-only bilingual timezone settings UI and emulator transport are implemented. Keep Production writes disabled. After Stage 0 evidence and explicit release approval, deploy the trusted callable in a coordinated release, then offer an explicit opt-in timezone confirmation/update to existing accounts. Run deterministic server-clock tests at day/week/hour boundaries across supported IANA zones.
3. Define a versioned, auditable baseline for legacy XP, level, weekly XP, wins, stats and achievement state. Preserve every existing account field; resolve anomalous/negative/overflow values explicitly rather than coercing them.
4. Extend the trusted transaction to write the approved progression projection and reward receipt atomically. Preserve idempotency for concurrent/retried claims.
5. Run two-account authenticated browser acceptance for Classic, including event boundaries, same-session retries, simultaneous claims, reload/resume, existing profiles, and unchanged private profile fields.
6. Add reversible client feature gates and prepare a coordinated client + Rules cutover. Do not tighten Rules before the shipped client uses compatible trusted paths.
7. Obtain explicit owner approval before any Production deployment or data migration.

## Server event reward implementation (2026-11-21)

- `server/quiz-event-rewards.mjs` calculates event multipliers from the authenticated callable's server timestamp and the validated private profile `timeZone` value. Missing legacy values default to UTC.
- The trusted claim transaction applies those multipliers and stores the effective multipliers/event IDs in its immutable receipt. Weekend XP, Night Owl XP, Monday Motivation XP and Happy Hour coin bonuses retain the current client schedule; overlapping XP boosts do not stack.
- New profiles persist their detected IANA timezone. The profile-create callable validates it, and the public projection deliberately omits it.
- An owner-only, bilingual timezone settings card is now implemented, but its save action is deliberately available only in the isolated demo emulator. Production users cannot change the preference yet. Do not cut over existing players until the secure callable is separately released and each legacy user's intended timezone is explicitly confirmed.

## Existing-account timezone preference backend (2026-11-21)

- `server/profile-timezone-update.mjs` validates an IANA timezone and transactionally updates only the authenticated user's private `users/{uid}.timeZone` field. XP, level, coins, stats, public profile and other fields are not touched.
- `server/profile-timezone-callable-adapter.mjs` derives UID from Firebase Auth, rejects anonymous users and rejects every payload field except `timeZone`.
- `profileTimeZonePreview` is exported from Functions but guarded to the isolated `demo-quizhub` Auth/Firestore/Functions emulators. It is not a Production endpoint.
- Unit tests cover preservation of legacy progress/economy fields, invalid zones, missing profiles, authentication and payload allowlisting.
- A user-facing settings control, opt-in migration/backfill, and Production deployment remain open. Missing legacy preferences continue to resolve to UTC.

## Safety boundary

This preparation adds a server-side timezone preference service, a strictly emulator-guarded callable, and unit/emulator tests. It does not change deployed Rules or Functions, indexes, Auth settings, live Firestore data, reward balances, or feature flags. The new callable and all trusted reward acceptance remain emulator-only.


## Owner timezone settings UI preview (2026-11-21)

- The owner's profile now includes a localized IANA timezone selector. The saved value is shown when present; otherwise the browser's detected timezone is only a suggestion and is not written automatically.
- Saving requires a confirmation prompt and uses the authenticated `profileTimeZonePreview` callable. The client validates the IANA value and checks that the returned UID matches the current Firebase Auth user.
- The transport is restricted to the local `demo-quizhub` project, both local hostnames, explicit `firebaseEmulator=1&profileTimeZonePreview=1` flags, and a non-anonymous account.
- Production and non-opted-in hosts render the setting read-only with the reason; there is no insecure direct Firestore fallback.
- The UI does not perform a bulk migration. Existing users choose and confirm their own timezone; accounts with no saved preference continue to resolve to UTC until they opt in.


## Legacy progression baseline audit (2026-11-22)

- Added a read-only `auditLegacyProgressionProfile` helper for legacy `users/{uid}` profile snapshots. It validates safe integer counters, checks game/win/answer/level consistency, retains the legacy snapshot and reports anomalies without writing data.
- The helper intentionally returns `eligibleForAutomaticImport: false` and never proposes trusted `achievementFacts`. A profile field being internally consistent does not prove it was earned legitimately: the historical browser path could write these values.
- Legacy and trusted achievement semantics differ for `perfect_score`: the legacy client checks `stats.bestStreak >= 10`; the trusted catalog checks a server-scored perfect quiz. Neither the legacy ID nor `bestStreak` can be translated into trusted `perfectGames`.
- Existing `achievementFacts`, when supplied by a trusted collector, are kept separate from the legacy snapshot and validated independently.
- This is a dry-run audit primitive only. No Firestore reads/writes, account migration, Production deployment, Rules changes or feature-gate changes are included.
