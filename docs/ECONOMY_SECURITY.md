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
- `server/quiz-reward-claim.mjs` now defines an idempotent **transaction contract**: a claim reuses its stored receipt on retry, and the quiz result is recomputed using server-owned answers. Unit tests simulate atomic and concurrent claims. The Firestore Standard adapter now implements atomic session/user updates, but still requires authenticated server hosting and private session rules before release.
- `server/question-delivery.mjs` prepares a backend-only question catalog with stable IDs and returns public payloads without `correctIndex`, `points`, or explanations. This is a serialization contract only: the current frontend still downloads its existing public question bank, so the correct answers are **not yet secret**.
- `server/quiz-firestore-store.mjs` is an **unmounted Firebase Admin adapter for Standard `(default)`**. It stores canonical server sessions under `quizSessions/{id}` and updates only approved economy fields on `users/{uid}` within the same Firestore transaction. It preserves unrelated user metadata and nested stats. The deterministic fake-Firestore tests prove adapter mapping, serialized retries and rollback semantics; the real Firestore-emulator suite now confirms persisted sessions, three concurrent claims with a single credit, profile-field preservation, ownership checks and failed-claim rollback; security-rule attack tests are still pending.
- `server/quiz-service.mjs` composes start → answer → complete into one backend-only API contract, with an injected transactional store and end-to-end in-memory tests. This is not a deployed HTTP/callable endpoint and does not replace Firebase client calls yet.
- Reward-bearing server sessions currently allow **Classic only**. Survival, Time Trial and Duel have distinct scoring/gameplay semantics; their server-authoritative validation must be implemented and tested before enabling these modes. This restriction applies to the backend-only API and does not disable existing browser play.
- `server/firebase-quiz-callable-adapter.mjs` adds a separate Firebase callable transport contract for the four quiz operations. It requires an authenticated Firebase request, uses a server clock, rejects extra envelope fields, and maps known errors to safe callable codes. `tests/server-firebase-quiz-callable.test.mjs` exercises forged economy fields, anonymous requests and internal-error redaction. **This adapter is not exported as a deployed Function yet**: a durable session store and private question bank are still prerequisites.
- The backend service now has an owner-checked `resume()` contract: it retrieves the next unanswered public question, distinguishes expired/ready/completed sessions and returns only the already-claimed receipt after completion. This is **not** wired into the browser or persisted Firebase yet.
- Server answer submissions are idempotent for exact replays of an already accepted question+answer: callers receive the current next question without a second recorded attempt. Conflicting answer changes are rejected. Tests cover concurrent duplicate requests.
- `server/authenticated-quiz-handler.mjs` provides a transport-independent request boundary: it only trusts a verified identity and server-owned timestamp supplied by an authenticated host, rejects browser-supplied UID/time/score/rewards and uses a strict operation-field allowlist. This is **not token verification** and does not expose a callable endpoint.
- The server-only service is **not deployed** and the browser does not use its endpoint. The new Firestore adapter exists but is not wired to an exported function, and `quizSessions` access restrictions still require reviewed rules. A new process would reset its state. Do not expose it directly to clients or treat it as production anti-cheat.

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

## Firestore edition discovery attempt (2026-11-15)

- The existing GitHub OIDC CI service account `quizhub-github-ci@quizhub-e65f5.iam.gserviceaccount.com` successfully authenticated without storing permanent credentials.
- A **read-only** `gcloud firestore databases list --project=quizhub-e65f5` metadata query could not complete under that account's current permissions. The CI logs intentionally omit error details and never print credentials or user data.
- The production database edition is now **confirmed by the project owner’s Firebase Console screenshot (2026-11-16)**: **Standard**, database ID **`(default)`**. CI metadata permission remains restricted; no IAM changes were made.
- **No Firestore changes, IAM grants, rules deployments or data reads were attempted.** Do not add IAM roles silently. Request explicit project-owner approval for narrow metadata-only access or obtain a verified edition/database ID before authoring a production Firestore store adapter.

## Emulator-only authenticated quiz callable (2026-11-16)

- `functions/index.mjs` now exports `quizSessionPreview` with a **fail-closed emulator-only guard**: the project must be `demo-quizhub`, and Functions, Firestore and Auth emulator environment signals must all be present. In any real Firebase project the callable returns `QUIZ_PREVIEW_DISABLED` without writing sessions or rewards.
- `functions/test-quiz-callable-emulator.mjs` performs real HTTP calls to the Functions emulator using Auth emulator tokens. It tests anonymous rejection, forged identities, unsupported modes, cross-user session access, answer replay, one-time reward claim and persistence in the Firestore emulator.
- The Functions build, authenticated HTTP test, isolated Firestore transaction suite and existing browser smoke tests all passed in GitHub Actions.
- **Release gate unchanged:** do not remove the emulator-only guard or connect the browser until private server-only answer keys, reviewed Firestore rules, trusted reward paths for other game modes and account migration checks are complete.

## Isolated Firestore session-rule prototype (2026-11-16)

- `tests/fixtures/quiz-sessions.rules` defaults to deny and disallows **all client operations** on `quizSessions/{sessionId}` (including owner reads). This protects canonical answers and receipts behind server-only Firebase Admin access.
- `firebase.rules-preview.json` is a dedicated **emulator-only** configuration. It intentionally denies all other collections and is **not suitable for production deployment** or the current browser application's full feature set.
- `functions/test-quiz-session-rules-emulator.mjs` creates two distinct Auth emulator identities, seeds a session using the trusted Admin SDK, then tests anonymous, owner and cross-user GET/list/create/update/delete and attempted reward forgery via the Firestore REST client. It asserts every client attempt is denied and verifies the canonical session remains intact.
- The GitHub Actions Firebase emulator job runs the existing browser/Function integration first, then launches a **separate** emulator with the restricted rules. Both steps passed on commit `622bc05cc4f6562b31439ce39af36bf16a3ec7fc`.
- **Still blocked for production:** profile privacy split, cross-user friends workflows, full collections/query inventory, removal of direct client economy writes and private answer-key migration. No production rules or callable deployment has occurred.

## Trusted public-profile synchronization preparation (2026-11-16)

- `server/public-profile-sync.mjs` introduces a **not-deployed** Firebase Admin transaction for copying an allowlisted projection of `users/{uid}` into `publicProfiles/{uid}`. It reads both documents transactionally and returns `created`, `updated`, `unchanged`, or `missing`; identical retries avoid writes.
- Updates replace the public document entirely rather than merging: unexpected legacy fields (`email`, `coins`, permissions, private friend arrays) are removed. The source private account is never changed by this module. User-supplied client payloads are not accepted.
- Tests include malformed UIDs/nicknames, missing accounts, update idempotency, unapproved-field stripping and three concurrent syncs using the real Firestore emulator. Existing browser and server workflows remain green on commit `fccbfbcd183a97f3801afd60d5e9f353727c84b6`.
- `app/modules/profile/profile-read-source.js` centralizes a **disabled** public collection read switch for leaderboard, nickname availability, friends search and other-user cards; own-profile data still comes from `users`. Production reads have not switched.
- **Not a live sync trigger:** this module must be invoked from reviewed server-side account creation, profile edits and authoritative score updates after the secure backend and rules migration. No backfill or production database write has been performed.

## Atomic reward and public ranking projection (2026-11-16)

- `createQuizFirestoreStore(db, { syncPublicProfiles: true })` adds an **explicit opt-in** to stage public-profile changes in the same native Firestore transaction as the authoritative user reward and quiz claim marker. The default remains `false`.
- The adapter reads the existing `publicProfiles/{uid}` document before writes, then fully replaces it with the allowlisted `buildPublicProfile(uid, nextUser)` projection. Missing or malformed legacy nicknames skip projection; no malformed public document is created.
- Unit and real Firestore emulator tests verify atomic three-document claims, correct XP/weekly XP, private-email/friends exclusion, concurrent claim idempotency, and replay no-op. All CI passed at `dbda502c553e582333f34fa9c407b74ff2ea4f43`.
- **Deployment is blocked:** the opt-in is not enabled in the callable or browser; `quizSessionPreview` remains emulator-only and production rules have not been migrated. A backend-driven account/profile edit path is still needed to keep nicknames and cosmetics in sync outside reward claims.

## Server-only unique nickname rename contract (2026-11-16)

- `server/profile-rename.mjs` stages an authenticated-host-only Firestore transaction to rename an existing profile by reserving `nicknameClaims/{lowercaseName}`. The operation updates `users/{uid}`, replaces the safe `publicProfiles/{uid}` projection, creates the new claim and deletes the old claim atomically. It does not accept score, coins or other profile mutations.
- Case-insensitive collisions cannot be resolved by a client-side nickname query alone; the transaction rejects occupied claims. Two concurrent attempts to use one name yield one successful rename and one `NICKNAME_TAKEN` response in the Firestore emulator. A same-name retry is a no-op.
- **Migration gate:** existing `users/{uid}` with no matching, owner-validated `nicknameClaims/{nicknameLower}` cannot rename (`PROFILE_MIGRATION_REQUIRED`). A safe, collision-reviewed claims backfill is required before enabling this endpoint. There is no live HTTP callable, no backfill, and no deployed rules authorizing this yet.
- The emulator suite also rejects malformed nicknames and confirms that email/coins do not leak into the public profile after a rename. All CI passed on `5f47c36214dbf6d5f94f9940981cddd89df5584a`.

## Nickname claims dry-run migration planner (2026-11-16)

- `server/nickname-claims-backfill.mjs` provides a **pure, read-only** migration plan from existing `users/{uid}` snapshots and `nicknameClaims/{normalized}` snapshots. It batches proposed reservations up to 400 per group. **It does not query or write any live database.**
- Duplicate names (including case variants) produce conflicts for **all** affected players; no arbitrary first-winner selection occurs. Foreign-owned or malformed claim records are never overwritten. Duplicate UIDs, inconsistent lowercase fields, invalid characters and missing nicknames are quarantined.
- Matching existing reservations are skipped for idempotent reruns; reports include only UIDs, normalized public nicknames and reason codes, never private emails, balances or source account payloads.
- Unit tests validate deterministic sorting, uniqueness, privacy, invalid data, conflicts and retries. All four CI workflows passed on `6d19bf945613e31caeabe739e83a35cc6e90745a`.
- **Next release gate:** a privileged, reviewed backfill runner must first take consistent production snapshots, display dry-run counts, resolve duplicates, and apply claims with create-only preconditions. This planner alone does not make nickname renaming or account creation ready for production.

## Emulator-only nickname reservation migration executor (2026-11-16)

- `server/nickname-claims-apply.mjs` consumes the reviewed snapshot plan. Its default `dry-run` mode reports counts without touching Firestore.
- `apply` requires exact `APPLY_DEMO_NICKNAME_CLAIMS` confirmation, `projectId: 'demo-quizhub'`, a running Firestore emulator, and zero planned conflicts or invalid records. It **refuses all production projects**, regardless of confirmation.
- Every proposed claim is verified in a Firestore Admin transaction against the **current** user's nickname and lowercase field. It creates only absent `nicknameClaims/{normalized}` documents; already-owned claims are idempotent, foreign-owned claims fail without overwrite, and changed/deleted users abort that transaction. Neither private account fields nor public profiles are changed.
- Transactions are per claim, not one global all-or-nothing migration: later failures may leave earlier valid claims. Regenerate a plan from a fresh snapshot and safely retry after resolving conflicts. The emulator integration test exercises opt-in guards, stale data, malicious ownership collisions and reruns.
- **Production remains blocked:** requires consistent production snapshot and a controlled write freeze or equivalent coordination, full conflict resolution, reviewed production executor/rollback procedure, authentication migration and deployable security rules. This test executor is not a production migration command.

## Atomic server-side profile creation contract (2026-11-17)

- `server/profile-create.mjs` stages a **trusted-server-only**, not-deployed registration transaction. It takes a verified server-supplied Auth UID and email (never trusting client-supplied identity), validates the requested nickname, and creates `users/{uid}`, `publicProfiles/{uid}`, and `nicknameClaims/{lowercaseNickname}` together.
- Existing private/public profile records cannot be overwritten, and case-insensitive nicknames are reserved with a create-only transaction. Simultaneous registrations for the same nickname produce exactly one winning account, with no orphan profile for the loser.
- The private account keeps the existing browser-compatible starter data (100 coins, level 1, cosmetics and friends arrays). The public profile contains only the allowlisted projection; no email, balance, private arrays or purchased cosmetics leak into the directory.
- `functions/test-profile-create-emulator.mjs` exercises concurrent races, case folding, invalid input, existing-account preservation and public projection privacy against the real Firestore emulator.
- **Release gate:** the existing browser still uses direct client `setDoc`; this function is **not callable**, not deployed, and must not be wired into the browser until the legacy claims migration, authenticated callable boundary, conflict policy and production Firestore rules are reviewed together. A trusted callable must derive UID/email from verified Firebase Auth context, never raw request fields.

## Authenticated profile-create callable preview (2026-11-17)

- `server/profile-create-callable-adapter.mjs` checks the verified Firebase callable `request.auth` context and accepts only `{ nickname }` from the client. UID and email come from Firebase Authentication, not caller-controlled JSON. Anonymous sessions and forged UID/email/coin payloads are rejected.
- `functions/index.mjs` exposes `profileCreatePreview` **only under the demo-quizhub Auth + Firestore + Functions emulators**. Production requests receive `PROFILE_CREATE_PREVIEW_DISABLED` even if someone deploys the function accidentally. The live browser still uses the previous flow and is not connected to this endpoint.
- `functions/test-profile-create-callable-emulator.mjs` signs in two real emulator users, sends authenticated HTTP callable requests, verifies forged/anonymous requests fail, and races two case-variant nicknames. Exactly one private user, public profile and claim are created; verified Auth email stays private. Repeated requests cannot reset coins or overwrite an existing player.
- **Required before browser rollout:** complete consistent legacy nickname migration, review enforceable Firestore client rules and public profile queries, decide same-identity retry UX, and introduce a controlled feature-gated switch. No live registration behavior or Firebase project data has changed.

## Read-only legacy account compatibility audit (2026-11-17)

- `server/legacy-account-audit.mjs` analyzes complete snapshots of `users`, Firebase Auth UIDs, `nicknameClaims`, and `publicProfiles` without credentials, database access or writes. Incomplete snapshot sets are rejected.
- A `ready` report means the supplied snapshots have one matching Auth UID, matching reserved nickname and exact privacy-safe public projection per account. `needs_backfill` reports absent claims/public cards, while `blocked` identifies identity mismatch, duplicate nicknames/UIDs, foreign-owned or stale reservations, orphan public cards, malformed profiles or unexpected/private public fields.
- Reports include only UID, issue code and severity; they **never echo** emails, balances, friends, achievement lists or entire account payloads. The audit leaves all legacy account data unchanged. CI tests cover consistent snapshots, safe backfill cases, collisions, stale ownership, privacy leaks, orphan identities and duplicate identifiers.
- **Scope limitation:** this checker does not verify independent chat/message collections or prove full migration integrity in a live project. Those relationships and write-freeze/snapshot consistency must be audited separately before switching production registration and client rules. No migration or live Firebase write was performed.

## Before/after data preservation gate (2026-11-17)

- `server/legacy-data-preservation.mjs` performs a **read-only deep comparison** of independently captured before/after snapshot manifests for a mandatory, explicitly enumerated protected collection list. It rejects missing/duplicate record identifiers, incomplete collection snapshots, deleted or unexpected records, and any changed nested values.
- The sample test inventory covers `users` (balances, XP, level, achievements and cosmetics), `friendships`, `chats`, `messages` and `quizResults`. **These are example manifest labels, not proof that the production database uses those exact collection paths.** The real collection/subcollection inventory must be derived from the actual app and Firebase data before production approval.
- Additional `publicProfiles` and `nicknameClaims` may be created without modifying the protected legacy records. The verifier emits collection, document ID and issue code only; never private message text, email, balance or nested profile contents. It does not mutate or export real player records.
- **Production release condition:** capture complete, consistent snapshots under an enforced write freeze (including nested subcollections and external Auth identities), keep independently verified recoverable backups, run the pre-migration identity audit, apply a reviewed migration, and demand `preserved` for every protected collection before lifting the freeze. No live backup, comparison or migration was run here.

## Repository-derived Firestore path inventory (2026-11-17)

- Reviewed the current application and trusted server document calls. `server/firestore-migration-inventory.mjs` now enumerates paths present in code, including nested paths, and defines required flat labels for preservation snapshot manifests.
- Private records that must remain unchanged: `users/{uid}` (balances, achievements, cosmetics, friend/request arrays, profile), `chats/{chatId}` and **`chats/{chatId}/messages/{messageId}`**, `dailyAttempts/{date}/users/{uid}`, `dailyPrizes/{date}/users/{uid}`, `dailyReceipts/{date}/users/{uid}`, `dailyRankings/{date}`, and `quizSessions/{sessionId}`.
- `online/{uid}` represents transient presence data; it is inventoried but not an immutable preservation gate. `publicProfiles/{uid}` and `nicknameClaims/{normalized}` are new projection/reservation paths permitted to grow under separately audited rules.
- **Correction to earlier illustrative tests:** There is no separate top-level `friendships` or `quizResults` collection in the currently reviewed source. Friends are stored as arrays in `users`; chat messages are nested below `chats`. The previous preservation test used generic sample labels, not production facts.
- `tests/firestore-migration-inventory.test.mjs` verifies the inventory's source references and enforces collection completeness, including nested messages. `server/legacy-data-preservation.mjs` now accepts slash-separated nested document identifiers in snapshot manifests.
- **Important limitation:** static code inventory cannot prove all real Firestore collections/subcollections, legacy abandoned data, or external integrations. A production snapshot collector must also enumerate actual database paths recursively and compare with this list; any unknown collection requires review before writes or cutover. No production data was read or changed.

## Canonical backup integrity manifests (2026-11-17)

- `server/backup-integrity.mjs` creates deterministic SHA-256 checksums for each collection and a root checksum for the complete snapshot manifest. It validates that all repository-derived protected manifest collections exist and also includes **unknown extra collections** in the integrity result.
- Document lists and JSON object keys are sorted before hashing so record order does not affect verification. Missing records, changed nested fields, new or removed collections, and inconsistent document IDs change the checksum or fail validation. Reports contain only collection names, counts and digests, not emails, balances or chat text.
- Inputs must already be canonical, tagged **JSON** snapshots: raw Firestore Timestamp, GeoPoint, Blob/bytes and DocumentReference objects are intentionally rejected until a reviewed exporter converts them without loss. JSON `undefined`, `NaN`, cycles and sparse arrays also fail closed. This is **not** yet a backup export or restoration tool.
- **Security limitation:** an unkeyed SHA-256 checksum proves a copy matches a previously trusted checksum, not that the checksum itself is authentic. The authoritative checksum must be kept separately in protected storage or signed. A complete, consistent collection-group inventory, encrypted backups, restore rehearsal and production release coordination remain outstanding.

## Isolated emulator restoration rehearsal (2026-11-17)

- `server/backup-restore-emulator.mjs` maps every repository-derived **protected** manifest key to the original Firestore path, including nested `chats/{chatId}/messages/{messageId}` and `dailyAttempts/{date}/users/{uid}`. It refuses unknown/derived collections, malformed document paths, invalid digests and replay attempts into occupied paths.
- The restore transaction uses create-only writes after reading all target documents, then reads back each document and checks both SHA-256 integrity and the deep preservation manifest. A maximum of 200 records is intentional: this is a **small, disposable emulator rehearsal**, not a scalable production importer.
- `functions/test-backup-restore-emulator.mjs` exercises player coins, friends, achievements, inventory, quiz progress, daily rewards/receipts and nested chat messages. It also checks tampered backups, invalid nested IDs, unknown collections and non-overwriting replay behavior. The GitHub Actions emulator job runs this test on `demo-quizhub`.
- Hard safety gates: an explicit `RESTORE_TO_DISPOSABLE_EMULATOR` confirmation, `GCLOUD_PROJECT=demo-quizhub` and a loopback `FIRESTORE_EMULATOR_HOST`. **No production restore, live export, Firestore rules deployment, data migration or player write was performed.**
- Production migration still needs a *complete and consistent* snapshot collector, lossless tagged Firestore value codec, unknown collection discovery, encrypted storage, immutable signed integrity metadata, scale/atomicity design and staged release approval.

## Firestore tagged-value backup codec (2026-11-17)

- `server/firestore-backup-codec.mjs` provides pure `encodeFirestoreBackupData` / `decodeFirestoreBackupData` for Firebase Admin Firestore values: nanosecond-precision Timestamp, GeoPoint, Buffer/Uint8Array, Date, references within the supplied Firestore client, and special numeric values (NaN, ±Infinity and negative zero).
- Typed values become explicit `__quizhub_firestore_type_v1` tagged JSON objects before checksum creation; decode constructs Firestore SDK values with explicitly supplied constructors and the original Admin database. Unknown special classes, malformed tags, reserved-tag collisions, cross-database references and unsupported JavaScript values **fail closed**.
- `functions/test-firestore-backup-codec.mjs` checks exact tagged JSON → disk JSON → SDK roundtrips using Firebase Admin classes, including malformed payloads and canonical snapshot integrity verification.
- The codec is now wired into the **emulator-only restoration rehearsal**: tagged values are decoded before the create-only transaction, then the readback is re-encoded for deep preservation and SHA-256 verification. Pass Firebase Admin `Timestamp`, `GeoPoint` and `DocumentReference` constructors via `firestoreTypes`. A tagged JS `Date` is deliberately rejected before writes: Firestore persists it as a Timestamp and thus changes its original tag. Backup exports should capture the SDK-read Timestamp, or perform an explicitly versioned Date-to-Timestamp canonicalization first. The real production export, recursive discovery, consistency boundary, encryption and signed proof are still pending.

- **Firestore precision boundary:** although the SDK Timestamp object carries nanoseconds, Firestore persists timestamps with **microsecond** precision. Emulator restoration rejects tagged timestamps whose nanoseconds are not divisible by 1000 *before* any transaction, preventing a misleading integrity promise. The codec itself keeps nanosecond precision for offline roundtrip; backup inputs must be canonicalized to Firestore's stored precision before restore.

## Read-only emulator snapshot capture (2026-11-17)

- `server/backup-capture-emulator.mjs` recursively enumerates **known** Firestore document paths and subcollections and generates a tagged-JSON snapshot plus integrity manifest. It uses `listDocuments()` to find nested records under *nonexistent* parent documents, including daily results. Read-only calls only; no deploy or mutation.
- Unknown root or nested collection paths block capture instead of being silently omitted; known ephemeral/projection roots such as `online`, `publicProfiles` and `nicknameClaims` are intentionally excluded from protected-data capture.
- `functions/test-backup-capture-emulator.mjs` runs in a fresh `demo-quizhub` Firestore emulator, separated from the larger concurrent test suite. It checks typed values, nested messages, orphan-parent daily results, digests, caps, unexpected collection rejection and unchanged player data.
- **Scope limit:** this is an emulator-only snapshot rehearsal, not a reliable live backup. Iterative reads do **not** represent one consistent instant if writes continue. A production-capable exporter requires a coherent snapshot/maintenance window, scalable paging, encrypted storage, signed provenance and discovery of every real legacy collection before any cutover.

- **End-to-end rehearsal:** the isolated emulator test now captures four seeded documents (including orphan-parent daily data and a nested chat message), verifies a tampered snapshot is rejected before writes, deletes only its own test fixtures, restores the authentic snapshot with create-only transactions, re-captures it, and compares the root SHA-256. This proves the test pathway only; it does not establish production backup consistency or readiness.


## Two-pass emulator backup stability probe (2026-11-17)

- `captureStableQuizHubEmulatorSnapshot` performs two complete read-only captures in the **isolated demo emulator** and compares their canonical SHA-256 roots. It aborts with `EMULATOR_SNAPSHOT_CHANGED_DURING_CAPTURE` if data changes between the passes.
- An emulator integration test deliberately changes a seeded player's coin balance between reads and confirms the capture fails, leaving that changed fixture untouched until test cleanup.
- Matching passes are **not** a point-in-time consistent snapshot: writes can occur within a pass or be reverted between passes. The response explicitly keeps `consistentAtSingleInstant: false`.
- **Production release remains blocked:** coordinate a real write freeze or use a supported consistent export mechanism, independently validate the complete inventory and verify a recoverable snapshot before any migration.


## Completeness failure scenarios (2026-11-17)

- Emulator tests now seed an unrecognized root collection and require the collector to fail closed without changing its document.
- A second test creates a protected nested `dailyPrizes/{date}/users/{uid}` document whose parent does not exist, then removes it between capture passes. The two-pass checker must reject the now-incomplete snapshot.
- These checks cover specific failure modes, **not** a proof that the repository inventory includes every collection in a live Firestore database. The production inventory and a coordinated consistent export still require independent review.


## Complete-package emulator restore gate (2026-11-17)

- `server/backup-package-emulator.mjs` adds a versioned `complete` envelope, emitted only for a verified two-pass emulator capture. It records the manifest root and total protected-document count.
- `restoreSealedQuizHubBackupInEmulator` checks the exact envelope structure, required protected collections, document count and SHA-256 integrity **before** invoking the existing create-only emulator restore.
- The integration suite rejects a simulated `writing` state and a truncated player snapshot, then restores a valid sealed capture and compares the resulting checksum.
- The envelope helps reject **accidentally incomplete artifacts**; it is not a cryptographic signature, cannot prevent a malicious actor from forging an internally consistent file, and does not replace a production-consistent export or secure external storage.


## Read-only restore conflict preflight (2026-11-17)

- `preflightSealedQuizHubRestoreInEmulator` checks the sealed package and queries the intended target documents without writing. It reports only aggregate conflict counts, required collection count, checksum and whether restoration is currently `ready` or `blocked_existing_documents`.
- The emulator test sees four conflicts before fixture deletion and zero after deletion; neither preflight changes existing records or exposes private UIDs in its report.
- **Not a lock:** records can change after this diagnostic. The create-only Firestore transaction in `restoreQuizHubSnapshotInEmulator` still independently checks for conflicts before writes and must remain authoritative.


## Restore preflight race rehearsal (2026-11-17)

- An integration test now runs a clean preflight, then simulates a competing writer creating an intended destination document before restore.
- The create-only transaction must reject with `RESTORE_TARGET_ALREADY_EXISTS`; the competing writer's document is unchanged and none of the other snapshot records may be restored.
- After removing only that disposable test fixture, the original sealed snapshot can be restored and verified normally. This tests all-or-nothing conflict handling in the emulator, **not** production recovery readiness.


## PR #2 final review edge case (2026-11-17)

- Reviewed the branch diff against `main`: the changes are limited to emulator-only backup capture/package, their test workflow, docs and a one-line existing emulator-restorer guard.
- Found and fixed an empty-backup edge case: invoking Firestore transaction `getAll()` with zero document references could fail. Empty protected snapshots now perform a verified no-op restore.
- A dedicated emulator integration test checks zero-document capture, sealing, preflight and restore, with the same root checksum.
- **No production safety claim:** these routines still require `demo-quizhub` and a localhost Firestore emulator. Existing deployed app, rules and real player data remain unchanged.


## Foreign profile UI redaction while migration is pending (2026-11-17)

- `projectProfileForViewer` now strips foreign player objects down to the same trusted public projection used by server sync. `loadProfile` and foreign card rendering call this projection before returning/rendering data; coin badges show only for the owner's card.
- Tests cover spoofed IDs, email, balance, admin flags, friend arrays and malformed public identities. The profile read migration flag remains disabled so existing gameplay/query behavior is not switched.
- **Critical limitation:** this is UI/data-flow redaction only. The legacy browser still downloads `users/{otherUid}` where rules allow it, so private fields can remain visible in network traffic. Actual privacy requires backfilling `publicProfiles`, changing all foreign queries, and deploying reviewed Firestore rules. Do not describe this change as secured profile reads.


## Public profile dry-run collision hardening (2026-11-17)

- `planPublicProfileBackfill()` is still a **pure in-memory preview**; it does not query or write Firebase and has no production backfill runner.
- Duplicate private-account UIDs are now fully quarantined: neither the first nor subsequent duplicate can produce a proposed public record.
- Nickname collisions are case-insensitive; all affected accounts are reported as conflicts instead of arbitrarily choosing a winner.
- Proposed writes, skips and conflicts are deterministically ordered, and existing divergent public records remain blocked for review (never silently overwritten).
- These safety checks are **not** a cutover approval. Complete snapshot consistency, ownership of nickname claims, private-field audits, server-only updates, verified access rules and client-query migration are still required before enabling public profile reads.
