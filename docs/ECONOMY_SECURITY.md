# QuizHub: economy trust boundary

Status: migration plan, **not deployed security protection**.

## Current behavior (verified in `refactor/foundation-stability`)

- The static browser app uses Firebase Auth and Firestore.
- `app/modules/quiz/modes/base.js` calls `updateDoc(users/{uid})` with `increment()` for `experience`, `weeklyExperience`, `coins`, `quizzesCompleted`, and stats.
- Individual quiz modes also supply win counters through `extraData`.
- The browser knows the question's `correctIndex` and controls `score`; therefore client-supplied results **cannot be considered authoritative**, even with client-side validation.
- No `firestore.rules`, `firebase.json`, or Functions package is committed to this branch. Deployed rules and Firebase billing/function availability have **not** been inspected.
- `saveResults` is single-flight per in-memory quiz session. This is a UX safeguard, **not** cross-device idempotency or fraud prevention.

## Implemented preparation (not deployed)

- `server/quiz-session-core.mjs` is a pure, server-only state machine. It computes points from a canonical answer key, validates ownership, question ordering, answer indices and deadlines, and rejects finalizing an in-memory session twice.
- `tests/server-quiz-session.test.mjs` exercises valid and adversarial paths in CI.
- `server/quiz-reward-claim.mjs` now defines an idempotent **transaction contract**: a claim reuses its stored receipt on retry, and the quiz result is recomputed using server-owned answers. Unit tests simulate atomic and concurrent claims. The real Firestore adapter must provide serializable transactions, authenticated user identity and private session writes.
- `server/question-delivery.mjs` prepares a backend-only question catalog with stable IDs and returns public payloads without `correctIndex`, `points`, or explanations. This is a serialization contract only: the current frontend still downloads its existing public question bank, so the correct answers are **not yet secret**.
- `server/quiz-service.mjs` composes start → answer → complete into one backend-only API contract, with an injected transactional store and end-to-end in-memory tests. This is not a deployed HTTP/callable endpoint and does not replace Firebase client calls yet.
- The backend service now has an owner-checked `resume()` contract: it retrieves the next unanswered public question, distinguishes expired/ready/completed sessions and returns only the already-claimed receipt after completion. This is **not** wired into the browser or persisted Firebase yet.
- Server answer submissions are idempotent for exact replays of an already accepted question+answer: callers receive the current next question without a second recorded attempt. Conflicting answer changes are rejected. Tests cover concurrent duplicate requests.
- This module has **no durable storage, Firebase endpoint, transactional claim marker, authenticated request context or private question delivery** yet. A new process would reset its state. Do not expose it directly to clients or treat it as production anti-cheat.

## Safe migration sequence

1. **Inventory all writes and queries.** Record user profile schema, stats, shop purchases, daily rewards, achievements, rankings, and chats. Identify public and private fields: Firestore rules cannot hide some fields within a readable document.
2. **Establish Firebase environment.** Confirm Firebase project ID `quizhub-e65f5`, database edition, deployed rules, existing data and indexes, and billing/function support before enabling backend writes.
3. **Separate authoritative questions from public assets.** A backend cannot reliably validate answers if the public client can fetch the answer key and submit arbitrary scores. Serve per-session questions without correct answers; keep the canonical answer key server-only. Plan for content IDs and versions.
4. **Create a signed-in server session.** A trusted endpoint creates a random session ID tied to `request.auth.uid`, mode, question IDs and server timestamps. Put time limits, question limits and answer attempts on the server.
5. **Record answers server-side.** Validate answer index for the server-selected question; advance state transactionally; enforce one answer per question, time windows and server-computed score. Never accept `score`, `correctAnswers`, multipliers or XP/coins as authoritative client inputs.
6. **Finalize exactly once.** In a Firestore transaction, check a `quizSessions/{id}` claim marker and atomically update the user's XP, coins, stats and win counters. Retrying the *same session ID* must return the original outcome without increments.
7. **Move other economy mutations.** Shop purchases, daily check-ins, event bonuses, achievements and leaderboard counters need equally trusted write paths. Protect profile updates and privileged roles.
8. **Deploy reviewed, tested Firestore Security Rules.** After clients use the server path, deny direct client mutations of economic fields. Use the Firebase emulator for owner/attacker cases and existing query compatibility.
9. **Release in stages.** Keep current clients functional until the new flow is verified end-to-end with test accounts, offline/retry cases and two devices. Monitor errors and migrate historical profiles.

## Required adversarial tests

- Anonymous, other-user and non-owner reads/writes; access to personal fields.
- Replayed completion, double-click, concurrent devices, flaky network after commit.
- Wrong answers, out-of-order answers, forged scores, modified answer key, expired sessions.
- Changed client clock, altered event multipliers, excessive or negative rewards.
- Deleted sessions, large payloads, injected fields, self-assigned admin privileges.
- Shop purchase race and negative balances, leaderboard data tampering.
- Regression: all four quiz modes, achievements, daily check-ins, profile and rankings.

## Release gate

Do **not** deploy restrictive Firestore rules alone: the current browser client would lose reward updates. Do **not** claim anti-cheat until the answer key and score calculation move to a trusted backend. Review the actual Firebase project/rules and database edition first.
