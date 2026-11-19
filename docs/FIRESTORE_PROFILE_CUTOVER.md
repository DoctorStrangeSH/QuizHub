# Public profile migration: release blockers

Status: **NOT READY**. This is a source-code inventory, not an audit of deployed
Firestore rules or real user records. `PUBLIC_PROFILE_READS_ENABLED` must remain
`false` until all checks below are verified against an isolated snapshot and
reviewed production configuration.

| Consumer | Current behavior | Required before cutover |
| --- | --- | --- |
| `friends/friends.js` | Friends/search/requests/leaderboard-style directory reads are routed through the migration gate, but legacy mode still downloads private `users` documents. | Verify `publicProfiles` backfill, all friend lookup paths and queries. |
| `leaderboard/leaderboard.js` | Directory query is gated and public fields are projected after fetching. | Verify public ranking fields and required indexes. |
| `profile/public-profile.js` | Foreign card read is gated; friend requests now delegate to the shared friends handler, whose published path still performs cross-user writes. | Switch the shared handler to audited authenticated server operations and test both profile and friends navigation. |
| `chat/chat.js` | Legacy mode downloads full `users/{friendId}` documents, but now retains only projected public identity fields in the chat UI. | Switch the network read to verified `publicProfiles/{friendId}` before owner-only rules can be enabled. |
| `profile/profile.js` | Registration checks nickname uniqueness through a directory query on `users` while the gate is disabled. | Switch to verified `nicknameClaims` reservations and server-only registration. |
| `reset-weekly.js` | Exported client routine reads and writes every account. | Remove from client authority; move reset to a trusted, idempotent scheduled server job. |
| `app.js` | Authenticated user reads/writes own profile; also resets own weekly XP based on browser local storage. | Move weekly reset decision to trusted server time and ensure it cannot be triggered per device. |
| `friends/friends.js` | Normal published UI still writes both users' arrays directly. | Deploy audited callable + rules, migrate client, then prohibit foreign writes. |

## Mandatory release gates

1. Confirm actual Firebase project and database **edition**, then inspect the deployed
   Firestore rules, indexes and Auth provider configuration. No database migration
   is authorized by this inventory.
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
