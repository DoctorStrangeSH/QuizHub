# Public profile migration: release blockers

Status: **NOT READY**. This is a source-code inventory, not an audit of deployed
Firestore rules or real user records. `PUBLIC_PROFILE_READS_ENABLED` must remain
`false` until all checks below are verified against an isolated snapshot and
reviewed production configuration.

The Firebase Console screenshot supplied on 2026-11-19 identifies the database
as `(default)`, **Standard** edition, **Native** mode, region `eur3`.
Scheduled backups appear disabled. This confirms instance selection only;
deployed security rules and recoverability have not been verified.

### Security-rules audit (source only, 2026-11-19)

- `firebase.json` configures Functions and emulators, but has **no** Firestore
  rules deployment entry. There is no root `firestore.rules` in this checkout.
- `firebase.rules-preview.json` points exclusively at
  `tests/fixtures/quiz-sessions.rules`. The CI job using it protects the
  `quizSessions` preview scenario in isolated emulators; it does **not** prove
  that production `users`, `publicProfiles`, chats or social writes are safe.
- `firebase.profile-privacy-preview.json` separately points to
  `tests/fixtures/profile-privacy-preview.rules`, an intentionally restrictive
  emulator-only prototype: owner-only reads of private `users`, authenticated
  reads of server-projected `publicProfiles`, and zero client writes. The CI
  two-user test rejects private reads, bulk `users` queries, impersonation and
  privileged writes. A separate Alice/Bob/Charlie scenario checks chat
  membership: participants can read server-seeded messages, outsiders cannot,
  and no client can rewrite membership or impersonate a sender. **This is not
  production-ready**: it deliberately breaks existing client-side profile
  creation, chat creation/message sending, friends, economy and gameplay writes
  until the server flows and UI are migrated and tested. Legacy chat records
  have no verified `memberUids` field; they require careful backfill before
  any chat membership read rule can safely replace the existing policy.
- The effective rules published to the `(default)` production database remain
  **UNVERIFIED**. The owner has supplied the current Rules-tab text in chat;
  that text appears broadly permissive and is audited in
  `docs/FIRESTORE_RULES_REVIEW_2026-11-19.md`. Do not equate the pasted text
  with an authenticated export of the active release.
- Before owner-only migration, obtain an authorized read-only export of the
  active ruleset and indexes, review it separately, and capture a verifiable
  backup. Do not copy preview-only rules into production.

| Consumer | Current behavior | Required before cutover |
| --- | --- | --- |
| `friends/friends.js` | Friends/search/requests/leaderboard-style directory reads are routed through the migration gate, but legacy mode still downloads private `users` documents. | Verify `publicProfiles` backfill, all friend lookup paths and queries. |
| `leaderboard/leaderboard.js` | Directory query is gated and public fields are projected after fetching. | Verify public ranking fields and required indexes. |
| `profile/public-profile.js` | Foreign card read is gated; friend requests now delegate to the shared friends handler, whose published path still performs cross-user writes. | Switch the shared handler to audited authenticated server operations and test both profile and friends navigation. |
| `chat/chat.js` | Chat directory reads now use the shared migration gate, projecting only public identity fields. With the gate disabled, it still downloads full `users/{friendId}` documents. | Backfill and verify `publicProfiles/{friendId}` before enabling the gate and owner-only rules. |
| `profile/profile.js` | Registration checks nickname uniqueness through a directory query on `users` while the gate is disabled. | Switch to verified `nicknameClaims` reservations and server-only registration. |
| `reset-weekly.js` | Exported client routine reads and writes every account. | Remove from client authority; move reset to a trusted, idempotent scheduled server job. |
| `app.js` | Authenticated user reads/writes own profile; also resets own weekly XP based on browser local storage. | Move weekly reset decision to trusted server time and ensure it cannot be triggered per device. |
| `friends/friends.js` | Normal published UI still writes both users' arrays directly. | Deploy audited callable + rules, migrate client, then prohibit foreign writes. |

## Mandatory release gates

1. ✅ Confirm the `(default)` **Standard** instance in `eur3` from the Console;
   **still required:** inspect the deployed Firestore rules, indexes and Auth
   provider configuration. No database migration is authorized by this inventory.
2. Capture and verify a complete, restorable snapshot of protected user/game data.
3. Reconcile every `users/{uid}` against `publicProfiles/{uid}` and
   `nicknameClaims/{normalized}`; quarantine collisions and malformed records.
4. Verify server-owned social transitions and registration through Auth, Firestore
   and Functions emulators, including anonymous, forged and concurrent requests.
5. Replace **all** foreign `users` reads and writes, including chat and the profile
   card, then test with owner-only `users` security rules.
6. Move weekly reset and privileged economy writes server-side. Do not ship
   strict owner-only rules while the existing client still needs cross-user writes.
7. Validate browser flows with two distinct accounts and both supported UI
   languages; confirm network requests never receive foreign private records.
8. Perform a reviewed, reversible rollout with backup verification and a
   documented rollback before enabling `PUBLIC_PROFILE_READS_ENABLED`.

Passing a source-level allowlist test proves only that UI code does not render
private fields. It **does not** prove network-level privacy or rules security.
