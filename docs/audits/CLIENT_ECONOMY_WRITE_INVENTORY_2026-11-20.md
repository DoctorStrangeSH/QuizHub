# Client-side economy write inventory — 2026-11-20

Status: source audit of the current `main` tree; **not a security certification and not a migration**.

## Executive finding

The browser still performs authoritative economy writes directly to `users/{uid}`. The server reward/session modules are not a replacement for the live browser path. Restrictive Firestore Rules or a production server cutover must not be deployed until every write below has a compatible trusted path and the existing UI has been migrated.

## Verified write surfaces

| Source | Current client write | Risk / migration requirement |
|---|---|---|
| `app/modules/quiz/modes/base.js` — `persistResults()` | `updateDoc(users/{uid})`: increments XP, weekly XP, coins, completed quizzes and game/question/correct-answer stats; mode `extraData` adds counters such as wins. | Highest priority. Browser computes score from a question bank containing `correctIndex`; client result cannot be trusted. Replace with one server session receipt and idempotent claim. |
| `app/modules/profile/profile.js` — profile creation | `setDoc(users/{uid})` creates the profile with initial 100 coins, XP, level, wins, stats, achievements, daily fields, owned cosmetics and social arrays. | Profile bootstrap must be moved to a validated owner/server creation flow. Initial currency must not be freely reset by repeated profile creation. |
| `app/modules/shop/shop.js` — item purchase | Reads user balance/ownership, then client `updateDoc` adds owned item, equips it and decrements coins with `increment(-price)`. | Race-prone read-then-write; two concurrent purchases can pass stale balance checks. Server must validate catalog price, ownership, balance and apply debit + grant atomically. |
| `app/modules/shop/shop.js` — bonus purchase | Reads coins and active bonuses, then client `updateDoc` decrements coins and writes client-computed expiry. | Server must validate bonus ID/price/duration and derive expiry using server time in one transaction. |
| `app/modules/shop/shop.js` — equip cosmetic | Client `updateDoc` changes equipped cosmetic field. | May remain a narrow owner preference write only after ownership/catalog validation is enforced. |
| `app/modules/daily/daily.js` — daily claim | Client `updateDoc` increments coins and daily streak, sets `lastDailyClaim` using serverTimestamp. | Claim eligibility and streak are client-read/client-decided. Move eligibility, UTC/day boundary and credit into trusted transaction; exact claim retry must not pay twice. |
| `app/modules/achievements/achievements.js` — achievements | Client `updateDoc` writes `achievements` array after client-side evaluation. | Client can self-award. Server must validate achievement conditions and idempotently grant unlocks/rewards. |

## Boundaries and non-findings

- The inventory above is based on direct source inspection of the listed modules on `main`; it is not a complete dynamic trace of every Firestore write in the application.
- `app/modules/quiz/modes/base.js` is the shared reward writer for Classic, Survival, Time Trial and Duel. Mode files delegate to it; they do not independently call `updateDoc`/ `setDoc` for quiz rewards.
- This report does not assert what the currently deployed Firestore Rules permit. No committed `firestore.rules` file exists in the inspected tree, and active production Rules still require owner-provided Console evidence.
- The source audit does not verify live Functions, database edition, deployed indexes, production Auth providers, or historical account data.
- Server mode reward claims and the Classic server reward claim are backend contracts/adapters. They do not by themselves switch the browser app away from the client writes above.

## Required migration order

1. Confirm production project/database, deployed Rules, indexes, Functions and data shape using the Phase 0 owner runbook.
2. Implement trusted profile bootstrap and preserve existing account data.
3. Migrate quiz rewards to authenticated server sessions; verify browser session start/answer/resume/claim against the trusted path.
4. Migrate shop purchases and bonuses to catalog-backed atomic server transactions.
5. Migrate daily claims and achievement evaluation/rewards to trusted idempotent operations.
6. Keep cosmetic equip and non-economic preferences as narrow validated writes where appropriate.
7. Add reviewed deny-by-default Rules and emulator attack tests only after all dependent reads/writes have been migrated.
8. Run authenticated browser acceptance on test accounts and two devices; retain rollback path and explicit owner approval before production deployment.

## Release gate

**BLOCKED.** Do not claim the economy is server-authoritative or anti-cheat protected while these browser write paths remain active. Do not deploy restrictive Firestore Rules alone: that could break existing profile, quiz, shop, daily and achievement flows. No production data, Rules, Functions or client behavior was changed by this audit.
