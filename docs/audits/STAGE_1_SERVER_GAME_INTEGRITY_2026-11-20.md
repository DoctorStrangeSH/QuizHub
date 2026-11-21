# Stage 1 — Server game integrity source audit

Date: 2026-11-20  
Scope: repository source review against V1 requirements QUIZ-01..07 and ECON-01. This is not a production deployment audit.

## Executive result

**Stage 1 is NOT complete. Production cutover is NOT authorized.**

The repository contains useful server-side building blocks and emulator tests, but the existing browser game still owns answer evaluation and directly writes rewards. The server quiz endpoint is explicitly emulator-only and supports only Classic. The Daily Challenge callable is exported without the same emulator-only guard; this makes it a deployable production function if the Functions code is deployed, but repository source alone does not prove whether that function is currently deployed. Daily Challenge server receipts do not currently grant competitive rewards, which matches the V1 rule that Daily Challenge must not grant competitive rewards before Stage 1 passes.

## Source evidence

### 1. Browser still evaluates answer correctness

- \`app/modules/quiz/modes/base.js\` renders \`data-correct\` into answer elements and handles correctness, score and feedback in the browser.
- The same module's \`persistResults()\` computes XP/coins in the client and writes \`experience\`, \`weeklyExperience\`, \`coins\`, \`quizzesCompleted\` and stats directly to \`users/{uid}\`.
- It subsequently reads the profile, calculates level in the browser and writes \`level\` directly.
- It triggers achievement evaluation from the browser after the reward write.
- \`app/modules/quiz/modes/classic.js\` and \`timetrial.js\` append client-provided win increments.
- \`app/modules/quiz/modes/survival.js\` writes \`stats.bestStreak\` directly through a client Firestore transaction.
- \`app/modules/quiz/modes/duel.js\` calculates the AI result and player score in the browser and uses the common client reward path.

**Consequence:** the current live UI path does not use the trusted quiz session service as its reward authority. The current broad user update Rules snapshot would permit owners to mutate their own economy/progress fields.

### 2. Server quiz session implementation is only a partial preview

- \`server/quiz-session-core.mjs\` contains pure server-side session, answer and finalization logic, including canonical answer keys and score recomputation.
- \`server/quiz-service.mjs\` explicitly rejects every mode except \`classic\` with \`UNSUPPORTED_QUIZ_MODE\`.
- \`server/quiz-reward-claim.mjs\` contains atomic reward-claim orchestration and idempotent receipt handling against a transaction-store contract.
- \`server/quiz-firestore-store.mjs\` persists canonical sessions in \`quizSessions\` and updates only authoritative profile fields.
- \`server/authenticated-quiz-handler.mjs\` and \`server/firebase-quiz-callable-adapter.mjs\` provide identity/payload/error boundaries.
- In \`functions/index.mjs\`, \`quizSessionPreview\` is deliberately guarded: it refuses requests unless the project is \`demo-quizhub\` and Auth, Firestore and Functions emulators are all active.

**Consequence:** this is useful emulator groundwork, not a production-ready path. Duel, Survival and Time Trial have no trusted scoring implementation in this service. Daily Challenge is a separate service.

### 3. Daily Challenge boundary differs from quiz preview

- \`functions/index.mjs\` exports \`dailyChallenge\` as an ordinary \`onCall\` function with no explicit emulator-only guard.
- Its handler derives UID from Firebase callable Auth context and server time from \`Date.now\`; the payload has an allowlist and excludes caller-supplied UID/score/reward.
- \`server/daily-challenge-service.mjs\` stores per-user UTC attempts and creates score receipts.
- \`server/daily-firestore-store.mjs\` writes Admin-side documents under \`dailyAttempts\`, \`dailyReceipts\`, \`dailyRankings\`, and \`dailyPrizes\`.
- The Daily Challenge complete operation creates a score receipt only. It does not credit competitive XP/coins.
- \`server/daily-prize-service.mjs\` is a separate proposed contract; no prize-claim callable is exported in \`functions/index.mjs\`.

**Consequence:** source shows a production-deployable Daily Challenge callable, but not whether it is deployed. Confirm deployed Functions inventory before any Rules or client migration. Do not enable Daily Challenge competitive prize claims until Stage 1 passes.

### 4. V1 coverage matrix

| V1 requirement | Source state | Stage 1 status |
|---|---|---|
| QUIZ-01 Classic | Client flow exists; server Classic preview exists | Blocked: client not switched; preview emulator-only |
| QUIZ-02 Duel | Client simulates AI and computes score | Not implemented on trusted backend |
| QUIZ-03 Survival | Client owns lives/streak and writes bestStreak | Not implemented on trusted backend |
| QUIZ-04 Time Trial | Client timer and speed bonus are authoritative in UI | Not implemented on trusted backend |
| QUIZ-05 Daily Challenge | Server UTC attempt/receipt service and callable adapter exist | Partial; no competitive rewards; deployed state unknown |
| QUIZ-06 Server answer key | Server canonical session supports this in preview; client still receives correctness markers in current mode | Not complete end-to-end |
| QUIZ-07 Idempotency | Server Classic reward claim has receipt/idempotency logic; client reward path uses increment writes and avoids retry rather than idempotency | Not complete end-to-end |
| ECON-01 Server XP/coins/stats | Server transaction coordinator exists for preview Classic | Not complete end-to-end for all V1 modes |

## Risks and required work

1. Do not remove the emulator guard from \`quizSessionPreview\` as a shortcut.
2. Do not deploy restrictive Rules before every dependent client read/write has a migrated and tested replacement.
3. Inventory actual deployed Cloud Functions; source exports do not prove deployment status.
4. Design trusted mode-specific session state for Duel (including deterministic/approved AI policy), Survival (lives/streak), and Time Trial (server-enforced per-question deadlines and speed bonus). Preserve the current product rules; do not invent new game mechanics in this audit.
5. Decide and document how Daily Challenge callable is released and how the current browser Daily Challenge is gated. The V1 rule prohibits competitive prize claims until Stage 1 is accepted.
6. Switch the client only after server endpoint, session lifecycle, reconnect/replay behavior, and reward receipt are verified end-to-end in emulators.
7. Make reward/achievement updates transactional and idempotent; do not depend on one-shot client increment writes.
8. Add adversarial and concurrent integration tests: forged UID/score/correctness, wrong user, duplicate answer/complete, concurrent completion, expired sessions, malformed data, and retry after ambiguous network failure.
9. Validate existing mode-specific fields (best streak, duel outcome, time bonus) are preserved or migrated into the trusted result schema.

## Stage 1 acceptance gate

Stage 1 may be marked Done only when:
- all four standard modes and Daily Challenge have trusted server-owned state and scoring according to the approved V1 rules;
- browser no longer supplies correctness, score, duration, rewards, XP, coins or authoritative statistics;
- server reward credit and receipt creation are atomic and idempotent;
- tests prove forged/duplicate/concurrent/expired/unauthorized requests cannot grant extra rewards;
- emulator and browser integration prove the real UI uses the trusted flow;
- Daily Challenge competitive prizes remain disabled until the acceptance gate passes;
- production Functions/Rules migration has a reviewed release plan, verified backup and explicit owner approval.

## Out of scope for this audit

No code path was switched, no new game mechanics were designed, no production Rules or Functions were deployed, and no user data was read or changed.
## Follow-up source remediation — 2026-11-21

The `dailyChallenge` export has now been wrapped in the same fail-closed emulator guard used by `quizSessionPreview`, `quizModePreview` and other preview callables. It requires project `demo-quizhub` and active Auth, Firestore and Functions emulators; otherwise it returns `DAILY_CHALLENGE_PREVIEW_DISABLED`.

This corrects the repository source exposure identified above for future deployments. **It does not disable or update an already deployed Cloud Function.** The deployed Functions inventory remains an owner/operator Phase 0 requirement and must be checked before any production migration or release.

## Verification addendum — 2026-11-21

The original findings above describe the source state at the audit date and are retained as historical evidence. Follow-up changes on main:

- PR #61 (`b937b03`) added the missing fail-closed emulator guard to `dailyChallenge`. This removes the source-level inconsistency described in section 3 for future deployments; it does not alter any already deployed Function.
- A fresh source scan of `functions/index.mjs` confirms that all seven exported callable functions currently require project `demo-quizhub` and active Auth, Firestore and Functions emulators, and reject requests otherwise.
- PR #62 (`9f7fab1`) added a Question Quality regression test that enumerates every exported `onCall` function and checks this guard. Question Quality, Visual Preview and Firebase Emulator workflows all passed on the merged commit.

The standard-mode implementation has also advanced beyond the original source snapshot: Classic has an authenticated server-session browser/callable acceptance test; Duel, Survival and Time Trial have authenticated callable emulator acceptance and browser UI preview acceptance (PRs #59 and #60). These remain emulator previews, not production client cutover. The live browser game still contains client-authoritative answer/reward paths, and Stage 1 remains NOT complete.

**Release boundary unchanged:** no production Functions or Rules deployment, no live Firestore reads/writes, no migration, and no owner approval has occurred. The actual deployed Functions inventory, active Rules/indexes, Auth configuration and production backup/restore evidence remain Phase 0 blockers.
