# QuizHub — Firestore read/write map (V1 source audit)

**Branch:** `audit/firestore-read-write-inventory-v1`  
**Date:** 2026-11-21  
**Scope:** source-derived paths and query shapes on `main`; this is not a live Production inventory.

## 1. Browser reads

| Feature | Collection/path | Query/read shape | Notes |
|---|---|---|---|
| Own account/profile | `users/{uid}` | Direct document read | Private profile, balances, stats and social ID arrays. |
| Foreign profile | `users/{targetUid}` today | Direct document read via `profileCollectionForViewer` while `PUBLIC_PROFILE_READS_ENABLED=false` | Projected in the browser before display; private document still reaches the browser. |
| Friend list / requests | `users/{uid}`, then foreign profile docs | Reads own profile arrays, then one profile document per friend/request | Foreign profile reads currently use legacy `users` source until public-profile cutover. |
| Friend search / nickname availability | `users` today | `nicknameLower` range query; search uses `>= q` and `<= q + \\uf8ff`; availability uses equality | Source is switched by `directoryCollection()`, but gate is currently false. |
| Leaderboard | `users` today | `orderBy(scoreField, desc)` + `limit(50)` | Dynamic score field is selected by the leaderboard mode. Verify all selected fields exist and are queryable in the eventual public projection before cutover. |
| Chat friend selector | `users/{uid}` and foreign profile docs | Own friends array followed by foreign profile reads | Uses the same viewer-aware profile source gate. |
| Chat history | `chats/{chatId}/messages` | Realtime listener, `orderBy(createdAt, asc)`, `limit(100)` | Legacy browser transport. Trusted history callable preview exists but is not the normal Production path. |
| Chat reactions | `chats/{chatId}/messages/{messageId}` | Direct message document read before reaction write | Normal Production path reads and rewrites a reaction map. |
| Online status | `online/{uid}` | Direct document read and realtime listener | Presence is separate from profile data. |
| Shop / achievements / daily login | `users/{uid}` | Direct own-profile document reads | Client reads values before legacy writes; server endpoints must independently validate state. |

## 2. Browser writes that still exist in the default path

| Feature | Path | Mutation | Intended trusted replacement |
|---|---|---|---|
| Profile creation | `users/{uid}` | `setDoc` initializes private account | `profileCreatePreview` callable exists but is emulator-only; production rollout needs verified UID/nickname-claim compatibility. |
| Quiz rewards | `users/{uid}` | XP, weekly XP, coins, counters and stats via `increment`; level updated separately | Trusted quiz session and single-use reward receipt. |
| Shop | `users/{uid}` | Coins, owned cosmetics, equipped cosmetics and active bonuses | Transactional purchase/equip endpoint with operation receipt. |
| Daily login reward | `users/{uid}` | Coins and streak increment; `lastDailyClaim` set from browser | Trusted daily-login claim with date-scoped idempotency receipt. |
| Achievements | `users/{uid}` | Browser evaluates conditions and writes achievement IDs | Trusted achievement facts and unlock receipts. |
| Friendships | `users/{actorUid}` and `users/{targetUid}` | Two-document array updates for send/accept/decline/cancel/remove | Trusted transactional friendship callable. |
| Chat send | `chats/{chatId}`, `chats/{chatId}/messages/{messageId}` | `addDoc` message; legacy client path does not create/maintain the trusted chat envelope consistently | Trusted send callable validates mutual friendship and participants, creates chat/message transactionally. |
| Chat edit/delete | `chats/{chatId}/messages/{messageId}` | Direct update of text/deleted flags | Trusted mutation callable validates membership and message authorship. |
| Chat reactions | `chats/{chatId}/messages/{messageId}` | Direct read-modify-write of reaction map | Trusted reaction callable validates participant set and reaction schema. |
| Chat presence | `online/{uid}` | Owner document set with online flag and timestamp | May remain client-owned only with explicit owner-only Rules and lifecycle/expiry semantics. |

All callable transports exported by `functions/index.mjs` currently have emulator-only guards. Names containing `Preview` are intentional and do not indicate Production availability. Do not deploy restrictive Rules until the published browser client and the Rules change are coordinated.

## 3. Server-side collection paths found in repository code

The following is a repository-derived inventory, not proof that documents currently exist in Production.

| Collection path | Purpose | Preserve if populated? |
|---|---|---|
| `users/{uid}` | Private account and game state | Yes |
| `chats/{chatId}` | Direct chat participants, timestamps, previews and read receipts | Yes |
| `chats/{chatId}/messages/{messageId}` | Private messages and reactions | Yes |
| `online/{uid}` | Ephemeral presence | No, rebuildable |
| `dailyAttempts/{date}/users/{uid}` | Daily challenge attempts | Yes |
| `dailyLoginClaims/{date}/users/{uid}` | Daily login idempotency receipts | Yes |
| `dailyPrizes/{date}/users/{uid}` | Daily challenge prizes | Yes |
| `dailyReceipts/{date}/users/{uid}` | Daily challenge reward receipts | Yes |
| `dailyRankings/{date}` | Daily challenge ranking snapshot | Yes |
| `quizSessions/{sessionId}` | Server-owned quiz session | Yes |
| `achievementFacts/{uid}` | Trusted achievement facts | Yes |
| `achievementUnlockReceipts/{uid}/unlocks/{achievementId}` | Idempotent achievement receipts | Yes |
| `shopPurchaseRequests/{uid}/requests/{operationId}` | Idempotent shop purchase receipts | Yes |
| `publicProfiles/{uid}` | Public allowlisted profile projection | Rebuildable from validated private profiles |
| `nicknameClaims/{normalized}` | Unique nickname reservation | Rebuildable only after collision audit |

The migration manifest now includes the previously omitted `dailyLoginClaims` and `shopPurchaseRequests` receipt paths as protected collections. This prevents a future preservation check from silently ignoring idempotency state.

## 4. Index/query observations

- The committed `firestore.indexes.json` currently contains one composite index: `recipientId ASC, deleted ASC, createdAt ASC` for message queries.
- The unread-count server query uses exactly those filters/order fields; the entry is consistent with that query shape.
- The chat history listener orders by `createdAt ASC` and limits to 100; this is a single-field query.
- Friend/nickname search uses a single `nicknameLower` field. Leaderboard uses one dynamic score field plus a limit.
- This comparison is source-only. The deployed composite indexes and single-field exemptions must still be exported from Firebase Console and compared before release.

## 5. Known gaps / release gates

1. Exact Production Firestore Rules are not present in the repository and have not been supplied.
2. `PUBLIC_PROFILE_READS_ENABLED` is false; foreign profile reads still source the legacy `users` collection.
3. Default Production browser mutations remain active in quiz rewards, shop, daily login, achievements, friendships, chat and profile creation.
4. All exported callable functions remain guarded for the `demo-quizhub` emulator; none is proven ready for Production.
5. Production indexes, Auth provider/domain settings, live collection inventory and tested Production backup/restore evidence are still outstanding.

## 6. Safety

This branch changes only the repository-derived migration manifest and its test. It does not read or write Production Firebase, deploy Rules/Functions, modify Auth settings, migrate data, or change feature gates.
