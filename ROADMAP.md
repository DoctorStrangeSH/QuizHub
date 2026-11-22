# QuizHub — Roadmap to V1

Last updated: 2026-11-22

This roadmap separates verified delivery from work that is still planned. A merged PR or passing emulator suite does not by itself mean a feature is deployed to Production.

## Current delivery track

| Area | Status | Evidence / next gate |
|---|---|---|
| Canonical account ledger event contract | DONE | `server/account-ledger-entry.mjs`, PR #94 |
| Atomic shop purchase ledger events | DONE | PR #95; create-only event in purchase transaction |
| Atomic daily login ledger events | DONE | PR #96 merged to `main`; emulator + unit coverage |
| Achievement unlock ledger events | DONE | PR #98 merged to `main`; unit + Firestore adapter coverage |
| Classic quiz reward ledger events | DONE | PR #97 merged to `main`; Question Quality, Emulator and Visual Preview passed |
| Duel / Survival / Time Trial ledger events | IN PROGRESS | Replacement PR #100; must pass CI on current `main` |
| Owner-scoped account history API | IN PROGRESS | Current branch `feat/account-ledger-history-api`; PR and CI pending |
| Account history profile UI | NOT DONE | Starts after API contract and emulator coverage are accepted |
| Refund event integration | NOT DONE / V1 SCOPE REVIEW | Confirm whether refunds exist in V1 before implementing |
| Production Firestore indexes and Rules review | NOT DONE | Requires owner-approved read-only production evidence and coordinated client migration |
| Functions deployment and browser cutover | NOT DONE | Emulator-only previews remain guarded |
| Legacy activity import | NOT DONE | Legacy client-side history must remain explicitly unverified unless audited |

## V1 release gates

1. **Economy event coverage**
   - All supported reward and purchase paths append one canonical event in the same transaction as the mutation.
   - Retries cannot duplicate balances or ledger entries.
   - Rejected/forged operations create no ledger events.
2. **History API**
   - Owner identity comes only from Firebase Auth.
   - Stable cursor pagination and allowlisted filters.
   - Responses expose only safe event fields.
   - Unit and Firebase Emulator tests cover ownership, tampering, empty pages, pagination and retries.
3. **Profile history UI**
   - Show readable reason, date, coin delta and XP delta.
   - Distinguish verified ledger events from any legacy/unverified activity.
   - Loading, empty, error and pagination states are accessible and mobile-friendly.
4. **Production readiness**
   - Review deployed Rules, required indexes, callable deployment, current client write paths and migration plan.
   - Do not deploy restrictive Rules or switch browser clients before all dependent flows are migrated and tested.
   - Keep production writes, migrations, deployments and feature gates unchanged until explicitly approved.
5. **Release acceptance**
   - Run full CI and emulator suites on the final merge commit.
   - Update `docs/IMPLEMENTATION_STATUS.md` with exact evidence.
   - Mark V1 complete only after the release gates above are satisfied.

## Working rules

- Prefer small, reviewable PRs with explicit dependencies.
- Never claim a CI check passed unless GitHub reports `completed / success` for the current head SHA.
- Never treat emulator-only callable previews as deployed production functionality.
- Do not backfill historical balances or events without a separate audited migration plan.
- Keep the roadmap updated with DONE / IN PROGRESS / NOT DONE and evidence.
