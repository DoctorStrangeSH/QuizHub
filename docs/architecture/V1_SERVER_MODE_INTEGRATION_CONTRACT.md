# Server mode integration contract — V1

Date: 2026-11-20  
Status: implementation plan derived from current source; not a production authorization  
Scope: define the safe integration boundary between the already merged pure mode rules/session transitions and the existing Classic-only `quizService`. No gameplay feature is added.

## Current verified baseline

- `server/quiz-service.mjs` currently rejects every mode except `classic`. This restriction is intentional and must remain until a mode-specific session has complete trusted scoring and reward finalization.
- `server/quiz-mode-rules.mjs` contains pure rules for Duel, Survival and Time Trial.
- `server/quiz-mode-session.mjs` contains pure in-memory state transitions and result projections for those three modes. It is not persistence, authentication, a callable endpoint or a reward path.
- `server/quiz-session-core.mjs` and `server/quiz-reward-claim.mjs` implement the currently verified Classic session and idempotent reward claim path.
- `functions/index.mjs` exports `quizSessionPreview` only behind the explicit demo-project + Auth/Firestore/Functions emulator guard. Do not remove that guard as part of mode integration.

## Source-derived browser contracts and naming discrepancy

| Player-facing mode | Browser `type` | Server domain name | Current rule |
|---|---|---|---|
| Classic | `classic` | `classic` | Up to 10 questions; win at 70% correct |
| Duel | `duel` | `duel` | Up to 7 rounds; AI probability easy/medium/hard = 40/60/80%; strict higher score wins |
| Survival | `survival` | `survival` | Starts with 3 lives; wrong answer consumes one life; ends at zero lives or when selected questions end |
| Time Trial | `time` | `timetrial` | Up to 10 questions; 15 seconds per question; correct answer gets +5 when displayed remaining seconds are >10 |

**Compatibility requirement:** the browser currently calls Time Trial `time`, while the server pure module calls it `timetrial`. The transport adapter must explicitly map the approved public mode identifier to the domain identifier. Do not silently accept arbitrary aliases.

## Required server session shape

A persisted non-Classic session must include, at minimum:

- immutable owner UID, session ID, public mode ID and domain mode ID;
- immutable ordered canonical question IDs, correct indexes, option counts and base points;
- start time, overall expiry and (for Time Trial) current question deadline;
- current mode state from `createModeState`;
- ordered accepted answer records with submitted option index and server timestamp;
- finalized flag and immutable reward receipt.

The canonical answer key and mutable mode state must remain server-only. Client payloads may contain only the session ID, current question ID, selected option index and language. Client-supplied UID, score, correctness, AI outcome, remaining time, deadlines, reward multipliers and reward amounts are forbidden.

## Required transition sequence

1. Authenticate the caller and derive UID exclusively from verified Firebase Auth context.
2. Validate the exact public mode identifier, category, difficulty, requested count and language.
3. Select and freeze the ordered question set using server cryptographic randomness.
4. Create the mode state with the actual selected question count (after mode cap).
5. Deliver only public question text/options; never return answer keys or base point values.
6. For each answer, validate session ownership, exact next question, answer index, session deadline and mode-specific deadline.
7. Derive correctness and points from the canonical question. For Duel, generate AI randomness on the server. For Time Trial, derive remaining time from the server-owned question deadline. Neither is accepted from the client.
8. Apply the pure transition function and persist answer log + updated state in one transaction.
9. Finalize only when the mode's completion condition is met. Recompute the result from canonical questions and accepted answer log; do not trust cached score/result fields without reconciliation.
10. Credit XP, coins, wins and mode-specific statistics in the same atomic transaction as the immutable receipt and finalized marker. Exact retry returns the original receipt and cannot credit twice.

## Mode-specific finalization requirements

### Duel

- Result is player win only when player score is strictly greater than AI score; equality is a draw.
- Only a player win increments `wins` and `stats.totalWins`.
- Player correct answers and AI correct answers are separate result fields. Only the player's correct count contributes to player profile `stats.correctAnswers`.
- AI result generation must be reproducible within the committed answer log so a retried answer does not roll again.

### Survival

- Stop accepting answers immediately when lives reach zero.
- Persist best run streak and update profile `stats.bestStreak` using max(previous, run best), not addition.
- The current browser mode does not add a mode-specific win counter.
- The run ends at zero lives or when the selected question set is exhausted.

### Time Trial

- Keep the exact strict speed bonus boundary: +5 only when server-derived remaining milliseconds are greater than 10,000.
- A timeout is recorded as an incorrect answer and advances the question without awarding points.
- Each question has its own 15-second server deadline; a client countdown is display-only.
- The mode's current browser identifier is `time`; map it explicitly to the server domain identifier `timetrial`.

## Transaction and retry invariants

- A transaction must read session and user state before issuing writes, consistent with Firestore transaction requirements.
- Concurrent answer submissions for one question must result in exactly one accepted transition. An identical retry may return the committed result; a conflicting retry must fail.
- Concurrent completion requests must produce exactly one reward credit. All retries return the same receipt.
- Profile updates must be field-scoped and preserve unrelated profile/social/settings fields.
- Survival best streak uses max semantics.
- Duel AI random outcome must be persisted as part of the accepted round so a transaction retry does not change the outcome.
- Reject malformed stored state rather than repairing it from client data.

## Acceptance matrix before enabling a mode

| Scenario | Duel | Survival | Time Trial |
|---|---:|---:|---:|
| Correct / incorrect scoring | Required | Required | Required |
| Wrong owner / anonymous caller | Required | Required | Required |
| Out-of-order question | Required | Required | Required |
| Conflicting duplicate answer | Required | Required | Required |
| Identical retry / concurrent answer | Required | Required | Required |
| End condition / answer after finish | Required | Required | Required |
| Deadline / timeout boundary | Overall session | Overall session | Per-question 15s |
| Concurrent completion / one reward | Required | Required | Required |
| Profile stats and mode-specific fields | wins | bestStreak | wins at 70% |
| Browser preview hides answer key | Required | Required | Required |

## Explicit release blockers

- Phase 0 remains open until owner/operator evidence is supplied for DATA-01 live inventory, SEC-02 active Rules/indexes export, AUTH-01 providers/domains and DATA-02 backup/restore rehearsal.
- Verify deployed Functions inventory before any production migration; repository exports alone do not prove deployed state.
- Complete trusted mode service + emulator integration + browser adapter tests before enabling any mode beyond Classic.
- Production Rules/Functions deployment and browser cutover remain prohibited until the complete migration and separate release approval.
- Do not merge the broad legacy PR #3 as a substitute for the scoped server migration.

## Source references

- `app/modules/quiz/modes/classic.js`
- `app/modules/quiz/modes/duel.js`
- `app/modules/quiz/modes/survival.js`
- `app/modules/quiz/modes/timetrial.js`
- `app/modules/quiz/timer.js`
- `server/quiz-service.mjs`
- `server/quiz-session-core.mjs`
- `server/quiz-mode-rules.mjs`
- `server/quiz-mode-session.mjs`
- `server/quiz-reward-claim.mjs`
- `server/quiz-firestore-store.mjs`
- `server/authenticated-quiz-handler.mjs`
- `server/firebase-quiz-callable-adapter.mjs`
- `functions/index.mjs`
