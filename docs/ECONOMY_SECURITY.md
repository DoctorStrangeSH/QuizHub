# QuizHub: economy trust boundary

Status: migration plan, **not deployed security protection**.

## Current behavior (verified in `refactor/foundation-stability`)

- The static browser app uses Firebase Auth and Firestore.
- `app/modules/quiz/modes/base.js` calls `updateDoc(users/{uid})` with `increment()` for `experience`, `weeklyExperience`, `coins`, `quizzesCompleted`, and stats.
- Individual quiz modes also supply win counters through `extraData`.
- The browser knows the question's `correctIndex` and controls `score`; therefore client-supplied results **cannot be considered authoritative**, even with client-side validation.
- `firebase.json` and a Functions package are now committed for emulator and daily-challenge development; **no `firestore.rules` is committed**. Current emulator tests therefore do not prove ownership restrictions. Deployed production rules, Firebase billing/function availability and the live database configuration have **not** been inspected.
- `saveResults` is single-flight per in-memory quiz session. This is a UX safeguard, **not** cross-device idempotency or fraud prevention.

## Implemented preparation (not deployed)

- `server/quiz-session-core.mjs` is a pure, server-only state machine. It computes points from a canonical answer key, validates ownership, question ordering, answer indices and deadlines, and rejects finalizing an in-memory session twice.
- `tests/server-quiz-session.test.mjs` exercises valid and adversarial paths in CI.
- `server/quiz-reward-claim.mjs` now defines an idempotent **transaction contract**: a claim reuses its stored receipt on retry, and the quiz result is recomputed using server-owned answers. Unit tests simulate atomic and concurrent claims. The real Firestore adapter must provide serializable transactions, authenticated user identity and private session writes.
- `server/question-delivery.mjs` prepares a backend-only question catalog with stable IDs and returns public payloads without `correctIndex`, `points`, or explanations. This is a serialization contract only: the current frontend still downloads its existing public question bank, so the correct answers are **not yet secret**.
- `server/quiz-service.mjs` composes start → answer → complete into one backend-only API contract, with an injected transactional store and end-to-end in-memory tests. This is not a deployed HTTP/callable endpoint and does not replace Firebase client calls yet.
- Reward-bearing server sessions currently allow **Classic only**. Survival, Time Trial and Duel have distinct scoring/gameplay semantics; their server-authoritative validation must be implemented and tested before enabling these modes. This restriction applies to the backend-only API and does not disable existing browser play.
- `server/firebase-quiz-callable-adapter.mjs` adds a separate Firebase callable transport contract for the four quiz operations. It requires an authenticated Firebase request, uses a server clock, rejects extra envelope fields, and maps known errors to safe callable codes. `tests/server-firebase-quiz-callable.test.mjs` exercises forged economy fields, anonymous requests and internal-error redaction. **This adapter is not exported as a deployed Function yet**: a durable session store and private question bank are still prerequisites.
- The backend service now has an owner-checked `resume()` contract: it retrieves the next unanswered public question, distinguishes expired/ready/completed sessions and returns only the already-claimed receipt after completion. This is **not** wired into the browser or persisted Firebase yet.
- Server answer submissions are idempotent for exact replays of an already accepted question+answer: callers receive the current next question without a second recorded attempt. Conflicting answer changes are rejected. Tests cover concurrent duplicate requests.
- `server/authenticated-quiz-handler.mjs` provides a transport-independent request boundary: it only trusts a verified identity and server-owned timestamp supplied by an authenticated host, rejects browser-supplied UID/time/score/rewards and uses a strict operation-field allowlist. This is **not token verification** and does not expose a callable endpoint.
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

## Security review update (2026-11-15): public profiles and private account data

Review of the browser modules reveals an architectural conflict that must be resolved **before** writing restrictive rules:

- `app/modules/profile/profile.js` stores `email`, `nickname`, `nicknameLower`, coins, XP, stats and friends together in `users/{uid}`.
- `app/modules/friends/friends.js` searches `users` with a nickname range query, reads other users' documents and writes `friendRequests`, `sentRequests` and `friends` on **both** parties' documents.
- `app/modules/leaderboard/leaderboard.js` queries the entire `users` collection ordered by `experience` or `weeklyExperience`, and `app/modules/profile/public-profile.js` reads another player's user document.
- Firestore rules secure entire documents, **not individual returned fields**. A rule allowing a foreign user to read `users/{uid}` for rankings also exposes the email and any other private data in that document.
- A rule allowing only `request.auth.uid == userId` would protect private fields but immediately break friend search, leaderboards, public profiles and cross-user friend-request mutations.
- The present emulator integration starts without a committed security rules file. Its successful Auth/UI tests must **never** be presented as tests of Firestore authorization.

### Required schema split and access matrix (planned; not implemented)

| Path | Read permission | Client writes | Data |
| --- | --- | --- | --- |
| `users/{uid}` (private) | Owner only | Profile preferences only, validated | Email, account settings; no public list |
| `publicProfiles/{uid}` | Signed-in users | Trusted server for ranks; tightly validated profile edits | Nickname, public avatar, level and ranking summary; **no email** |
| `friendRequests/{recipient}/{requestId}` or dedicated collection | Sender and recipient as appropriate | Validated create/cancel/accept operations | Sender UID, recipient UID, state, timestamps |
| `quizSessions/{sessionId}` | Session owner | Trusted server for authoritative results | Session state, claim receipt, score calculation |
| `users/{uid}` economic fields | Owner can read | **Server only** after backend migration | Coins, XP, wins, purchase state |

Before choosing the exact paths, inventory all remaining reads and writes for chat, events, daily challenges, achievements, shop and each quiz mode. Use a staged backfill for existing accounts; validate existing public queries against the new collections and indexes.

### Minimum emulator attack-suite release gate

Run tests with `firebase.json` explicitly referencing a reviewed `firestore.rules` (never with implicit open rules). In the suite, create two different Auth users and assert:

1. Anonymous attempts cannot list private user profiles; user B cannot get/update/delete user A's private document.
2. User A cannot assign admin claims, change email/owner metadata or inject extra fields, oversized strings or invalid types.
3. User A cannot inflate coins, XP, wins, weekly XP or achievements directly via the Web SDK.
4. Valid public-profile queries remain possible without revealing email; malformed public documents fail validation on create **and** update.
5. A request from A to B cannot alter B's rewards, friends or unrelated fields; accepting/cancelling requests follows an authorized state transition.
6. Trusted server finalization is idempotent under retries and concurrency, and existing gameplay still works in Chromium.

**Current gate status: BLOCKED.** No reviewed Firestore rules, privacy-safe public collection, or trusted economy migration is deployed. Keep the PR as draft and do not publish a claim that profile data or balances are secured.
