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
- `chatSendPreview` is an emulator-only callable with strict Auth identity,
  reciprocal-friendship checks, immutable member list, bounded message text,
  and an idempotent client message ID. The new `dm_...` chat ID is unambiguous,
  unlike the legacy underscore-joined UID convention. This is **not wired to
  the browser**: migrating existing conversations and enforcing the deployed
  message-write policy are prerequisites. A local mock transaction is not a
  substitute for Auth + Functions + Firestore emulator integration.
- `chatActionsPreview` extends the emulator-only path to `edit`, `delete` and
  `react`. Only a sender can edit/delete their own message; any verified chat
  participant may toggle only their own reaction in a transaction. Deleted
  messages cannot be edited or reacted to, and legacy malformed reaction maps
  require explicit review. The browser still uses legacy direct Firestore
  writes; do not expose these callables before production rules migration.
- The browser now routes chat ID construction through `chat-transport-gate.js`.
  `CHAT_SERVER_TRANSPORT_ENABLED` is hardcoded `false`; legacy IDs and direct
  Firestore writes remain intact. Editing/deleting failures are reported in
  the active chat instead of producing unhandled promises. Switching this gate
  is **not approved** until migrated history, server read/write contracts,
  dual-device behavior and verified restrictive rules pass end-to-end checks.
- `planLegacyChatMigration` is a **read-only, snapshot-driven** preflight. It
  maps existing `uids.join('_')` conversation IDs to collision-free `dm_...`
  destinations and rejects ambiguous IDs, nonreciprocal friendships, unknown
  senders, duplicate message paths and destinations containing data. It returns
  IDs and blocker codes, never message text. This is **not a migration script**:
  no messages are copied, deleted or modified. Before ever using it with real
  data, verify a complete snapshot including orphaned `messages` subcollections
  under missing chat parents, reconcile conversations after unfriend events,
  check attachment/reaction formats, verify a restorable backup and test a
  resumable dual-read cutover in isolated emulators. Incomplete snapshot input
  can produce a misleadingly green preflight and must never authorize release.
- `inspectLegacyChatsInEmulator` reads `users` and every `chats` document ref,
  including **missing chat parents** with surviving `messages` subcollections.
  It records only IDs and senders, enforces small inventory limits, and invokes
  the migration preflight without copying message text. CI runs it in a fresh,
  disposable Firestore emulator, never against the `(default)` production DB.
  It is still a non-transactional rehearsal, not a certified complete backup.
- The chat inventory now also checks migrated reaction maps: invalid emojis,
  malformed maps, nonmember reaction keys and reactions left on deleted
  messages block a copy plan for explicit reconciliation. Only blocker codes
  and document identifiers enter the report; private bodies and reaction
  values are never returned. The disposable-emulator copy rechecks these
  invariants inside its transaction so a stale green plan cannot silently
  copy newly invalid data. This remains an emulator-only source audit.
- `copyOrphanChatInEmulator` now performs an **explicitly confirmed, small**
  copy rehearsal in that disposable emulator only. It refuses non-mutual
  friendships, changed message IDs, an existing destination, and legacy chat
  parents with unknown metadata. One Firestore transaction creates a canonical
  chat plus exact copies of source message documents, preserving original
  timestamps, edits, deleted markers, replies and reactions. A post-copy check
  compares every source/destination document. **Source documents are never
  deleted**, and production migration remains blocked; this exercise is not a
  resumable, live dual-write or point-in-time migration protocol.
- The disposable-emulator chat lifecycle now continues **after** that copy:
  a new server-owned message is sent to the migrated conversation, the copied
  message is edited and reacted to by authorized participants, foreign editing
  is denied, and a fresh message is soft-deleted. The original legacy message
  is read back to confirm its body and reactions remained unchanged. This
  rehearsal does not yet exercise a browser or two devices and cannot replace
  a verified production rollout plan.
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
