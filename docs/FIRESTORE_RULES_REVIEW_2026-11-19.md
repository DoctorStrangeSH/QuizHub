# Firestore rules review — user-supplied rules, 2026-11-19

**CRITICAL / DO NOT DEPLOY AS A FIX.** These findings are based on the rules
provided in chat by the project owner, not an authenticated export of the active
Firebase rules release. Project `(default)` is Standard/Native in `eur3`.
No deployed rules were changed or inspected directly.
The supplied text is preserved for review in
`docs/FIRESTORE_RULES_REPORTED_2026-11-19.txt` (not a deployable rules file).

## Critical findings

| Path | Current authorization | Risk | Required replacement |
| --- | --- | --- | --- |
| `users/{uid}` | `read` for any signed-in user | A logged-in user can download entire other users' records, including private fields; filtering in JavaScript cannot hide that. | Owner-only private reads plus server-maintained `publicProfiles` for directory UI. |
| `users/{uid}` | `create/update` by owner with no field validation | User-controlled XP, coins, roles, friends and progress can be forged in their own record. | Immutable identities and server-owned economy, social and game fields; validated limited client edits. |
| `chats/{chatId}` and `messages/{id}` | Any signed-in user can read/create chats and messages | No membership enforcement; message `senderId` is not checked on create. | Server-validated membership, sender identity and message schema; test forged and third-party requests. |
| `shopItems`, `achievements`, `dailyRewards`, `events`, `settings` | Any signed-in user may write | Catalog, rewards and global configuration may be altered by normal users. | Server/admin-only writes, separate user-scoped reward records. |
| `questions/{id}` | Any signed-in user may create without owner/schema constraints | Forged author IDs, arbitrary data and unreviewed content. | Validated authorship, size limits, moderation workflow. |
| `friendRequests/{id}` | Any signed-in user may create/delete | Forged senders/targets and deletion of unrelated requests. | Server-owned transitions; or strict from/to validation and immutable identities. |
| `usernames/{name}` | Any signed-in user may create | Can reserve another account's name without ownership constraints. | Trusted `nicknameClaims` reservation with uniqueness and owner integrity. |
| `transactions/{id}` | Any signed-in user may create | Forged transaction records and another user's `userId`. | Server-only transaction issuance. |
| `users/{uid}/notifications/{id}` | Any signed-in user may create | Notifications can be inserted under any account. | Trusted event source or tightly validated sender and payload. |

All listed access is restricted to authenticated clients, but **authentication
alone is not authorization**. Absence of a default catch-all grant is good;
it does not remedy the overly broad grants listed above.

## Required staged response

1. Preserve and independently verify an up-to-date backup **before any rule
   deployment**. Console screenshot suggests scheduled backups are off.
2. Export and version the *actual* active rules release through authorized
   read-only access, then reconcile with the text supplied in chat.
3. Test a proposed restrictive ruleset only in an isolated Firebase Emulator
   project with Alice, Bob, unauthenticated requests, forged IDs, ownership
   escalation, replay and cross-account reads. Build and validate all existing
   client queries and server operations against it.
4. Move privileged client writes to trusted Functions and backfill public
   profiles/nickname claims before attempting owner-only `users` rules.
5. Deploy in reviewed stages with a tested rollback. Do **not** copy an
   experimental ruleset directly into the production Console.

**Release gate:** `PUBLIC_PROFILE_READS_ENABLED` remains `false` and PR #3 is
not production-ready. Security-rule fixes cannot safely be completed by
changing rules alone while legacy client code relies on cross-user access.
