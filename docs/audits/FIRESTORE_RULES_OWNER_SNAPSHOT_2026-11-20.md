# Firestore Security Rules — owner-provided snapshot and audit

Date received: 2026-11-20  
Source: exact Rules text pasted by the project owner in the QuizHub development conversation.  
Project documented in repository: `quizhub-e65f5`, database `(default)`.

> Provenance limitation: this is an owner-provided copy said to be the current Rules text. The repository/CI cannot independently prove that this exact source is the currently published Firestore Ruleset. Before a production change, export or copy the active Ruleset from Firebase Console and compare it byte-for-byte with this snapshot.

## 1. Exact snapshot supplied by owner

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuth() {
      return request.auth != null;
    }
    
    function isOwner(uid) {
      return isAuth() && request.auth.uid == uid;
    }
    
    // Пользователи
    match /users/{uid} {
      allow read: if isAuth();
      allow create: if isOwner(uid);
      allow update: if isOwner(uid);
      allow delete: if false;
      
      // Подколлекция уведомлений
      match /notifications/{notifId} {
        allow read: if isOwner(uid);
        allow create: if isAuth();
        allow update: if isOwner(uid);
        allow delete: if isOwner(uid);
      }
    }
    
    // Никнеймы
    match /usernames/{username} {
      allow read: if isAuth();
      allow create: if isAuth();
      allow update: if false;
      allow delete: if isAuth() && resource.data.uid == request.auth.uid;
    }
    
    // Вопросы
    match /questions/{questionId} {
      allow read: if isAuth();
      allow create: if isAuth();
      allow update: if isAuth() && resource.data.authorId == request.auth.uid;
      allow delete: if isAuth() && resource.data.authorId == request.auth.uid;
    }
    
    // Запросы в друзья
    match /friendRequests/{requestId} {
      allow read: if isAuth() && 
        (resource.data.from == request.auth.uid || resource.data.to == request.auth.uid);
      allow create: if isAuth();
      allow update: if isAuth() && resource.data.to == request.auth.uid;
      allow delete: if isAuth();
    }
    
    // Чаты
    match /chats/{chatId} {
      allow read, create: if isAuth();
      allow update: if isAuth();
      
      match /messages/{messageId} {
        allow read: if isAuth();
        allow create: if isAuth();
        allow update: if isAuth() && resource.data.senderId == request.auth.uid;
        allow delete: if isAuth() && resource.data.senderId == request.auth.uid;
      }
    }
    
    // Достижения
    match /achievements/{id} {
      allow read: if isAuth();
      allow write: if isAuth();
    }
    
    // Ежедневные награды
    match /dailyRewards/{id} {
      allow read: if isAuth();
      allow write: if isAuth();
    }
    
    // Магазин
    match /shopItems/{id} {
      allow read: if isAuth();
      allow write: if isAuth();
    }
    
    // События
    match /events/{id} {
      allow read: if isAuth();
      allow write: if isAuth();
    }
    
    // Транзакции
    match /transactions/{id} {
      allow read: if isAuth() && resource.data.userId == request.auth.uid;
      allow create: if isAuth();
    }
    
    // Настройки
    match /settings/{id} {
      allow read: if isAuth();
      allow write: if isAuth();
    }
  }
}
```

## 2. Findings

Severity below is an engineering assessment of the supplied text, not a claim that an exploit has been observed.

| Rule path | Current condition | Risk / consequence |
|---|---|---|
| `users/{uid}` read | Any authenticated user | Any signed-in account can read every user document, including fields stored alongside public profile fields (potentially email, progress, economy, social graph, inventory). |
| `users/{uid}` update | Owner of document | Owner can change every field in their own document. There is no field allowlist or server-owned-field protection; client can attempt to alter coins, XP, wins, achievements, streaks and inventory stored there. |
| `users/{uid}/notifications/{notifId}` create | Any authenticated user | A signed-in user can create a notification beneath another user's UID. |
| `usernames/{username}` read/create | Any authenticated user | All authenticated users can enumerate names; create does not bind the document's UID to the caller or enforce a schema/claim protocol. |
| `questions/{questionId}` create | Any authenticated user | Create does not require `authorId == request.auth.uid`. |
| `questions/{questionId}` update | Existing author | An existing author can update the document and change its `authorId` field because changed fields are not restricted. |
| `friendRequests/{requestId}` create | Any authenticated user | No validation that `from` is the caller or that the target/shape is valid. |
| `friendRequests/{requestId}` update | Existing recipient | No changed-field allowlist; recipient can rewrite fields including sender/recipient. |
| `friendRequests/{requestId}` delete | Any authenticated user | Any signed-in user can delete any friend request. |
| `chats/{chatId}` read/create/update | Any authenticated user | No chat membership check; any signed-in user can read or modify any chat parent document. |
| `chats/{chatId}/messages/{messageId}` read/create | Any authenticated user | No chat membership check for message history or message creation. |
| `messages` update | Existing sender | No field allowlist; sender can alter protected message fields, including senderId, during an otherwise authorized update. |
| `achievements/{id}`, `dailyRewards/{id}`, `shopItems/{id}`, `events/{id}`, `settings/{id}` | Any authenticated user can read/write | No owner, role, schema, or server-owned-field boundary. |
| `transactions/{id}` read | Authenticated and stored userId matches caller | Read is scoped to owner, but create accepts any authenticated caller without binding userId to caller or validating amount/type. Update/delete are not granted by this match and are denied unless another matching rule grants them. |

### Additional rule semantics

- Firestore Rules are allow-based: a matching `allow` grants the operation if its condition is true. These rules contain no explicit deny statements that override broad allows.
- Rules do not filter query results. A query must be provably constrained to documents the caller may read; broad `users`, `chats`, and `messages` reads are permitted here for every authenticated user.
- No root matches are supplied for collections such as `publicProfiles`, `nicknameClaims`, `quizSessions`, `online`, `dailyAttempts`, `dailyPrizes`, `dailyReceipts`, or `dailyRankings`. Absent another matching allow, access to those paths is denied by default.
- The nested `users/{uid}/notifications` match does not grant access to unrelated root collections.
- Admin SDK / Cloud Functions using service credentials bypass Firestore Security Rules. Moving a write to a callable is not safe unless the callable validates Auth identity, input, membership, idempotency and server-owned values.

## 3. Critical migration constraint

Do **not** replace the current Rules with owner-only or deny-by-default rules as a standalone change.

The current main branch still has client-side write paths for:
- user profile and progress fields;
- quiz and daily rewards;
- shop purchases and equipped items;
- achievements and weekly reset;
- friend relationship arrays;
- chat messages and presence.

A restrictive Rules deployment before migrating those paths will break existing flows and may prevent users from saving progress or using social features. Conversely, leaving the current broad Rules unchanged preserves the security risks above.

The correct sequence is:
1. Export and preserve the active production Rules and indexes; verify this snapshot against the actual deployed Ruleset.
2. Complete and test the owner-approved production backup/restore plan.
3. Inventory live collections, nested collections, legacy fields and clients.
4. Move economy, achievements, purchases, friend transitions, chat membership/message operations and other privileged writes behind validated server-side operations.
5. Split private profile data from public profile projections and migrate reads.
6. Author least-privilege Rules with explicit membership, ownership, field allowlists, immutable identity fields and server-owned-field protections.
7. Test the proposed Rules against real application behavior in the Firebase Emulator Suite using owner, stranger, anonymous and malformed/forged requests.
8. Deploy only after staged verification, with a documented rollback path and post-deploy smoke checks.

## 4. Release decision

**SEC-02: BLOCKED — high-risk Rules snapshot received; live Ruleset and indexes export still require independent verification.**

No production Rules, data, indexes, Functions or application code were changed as part of this audit. The supplied text is recorded as evidence for planning and review only.
