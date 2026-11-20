# V1 server scoring contracts — source-derived baseline

Date: 2026-11-20  
Status: implementation reference; not a production release specification  
Scope: preserve the behavior currently implemented by the browser modes while moving authority to the trusted backend. This document does not add game mechanics or authorize a production cutover.

## Why this document exists

The Stage 1 source audit found that the browser currently evaluates answers and writes rewards/statistics. The server quiz service currently accepts only `classic`. Before extending it, the existing rules for each approved V1 mode must be captured so that a server migration does not silently change gameplay.

The values below are taken from the current source files listed in **Source references**. Where the browser implementation relies on client time, randomness or mutable state, the server migration must replace that trust boundary without changing the player-facing rule.

## Shared rules

- The question's configured `points` are awarded only for a correct answer.
- The current shared reward calculation is:
  - `xp = floor(max(score, 0) * xpMultiplier)`
  - `coins = floor((max(score, 0) / 2) * coinMultiplier)`
- A multiplier is used only when it is finite and greater than zero; otherwise the shared helper falls back to `1`.
- The current profile level calculation is `floor(experience / 100) + 1`.
- The base result persistence increments `experience`, `weeklyExperience`, `coins`, `quizzesCompleted`, `stats.totalGames`, `stats.totalQuestions` and `stats.correctAnswers`. Mode-specific win counters are applied by the mode.
- Event XP/coin multipliers are currently read by the browser from the events module. In a trusted implementation, multiplier eligibility and values must be derived from trusted server-side event state, never accepted from the browser.
- The current UI shuffles answer option presentation. The server must keep the canonical correct answer private and bind submitted option indexes to the exact option order delivered for that session. Do not expose `correctIndex` or correctness markers to the browser.

## Mode contracts

### Classic

Source: `app/modules/quiz/modes/classic.js`, `app/modules/quiz/modes/base.js`.

- Maximum question count: 10; actual count is the number of selected questions after slicing.
- Each correct answer adds that question's `points` to score and increments correct answers.
- Incorrect answers add zero points.
- The mode ends after all selected questions have been answered.
- A win is recorded when `correctAnswers >= ceil(totalQuestions * 0.7)`.
- A win increments both `wins` and `stats.totalWins` by one.
- Shared XP/coin reward calculation uses the final score.

### Duel

Source: `app/modules/quiz/modes/duel.js`, `app/modules/quiz/modes/base.js`.

- Maximum rounds: 7; actual round count is the number of selected questions after slicing.
- Player correct answers add the round question's `points` to player score and increment player correct count.
- The current AI simulation independently rolls once per round. Its success probability is 0.4 for `easy`, 0.6 for `medium`, and 0.8 for `hard`; if no difficulty is present, the browser falls back to `easy`.
- An AI success adds that round's question `points` to AI score and increments AI correct count.
- Player victory is strictly `playerScore > aiScore`; equality is a draw. Only a player victory increments `wins` and `stats.totalWins`.
- Shared XP/coin rewards are calculated from the player's score and the player's correct-answer count is persisted as the common correct-answer statistic.
- The current browser uses `Math.random()` for the AI. The trusted backend must own the random outcome; the client must not submit the AI result or either score. This is a trust-boundary migration, not a change to the listed probabilities.

### Survival

Source: `app/modules/quiz/modes/survival.js`, `app/modules/quiz/modes/base.js`.

- Starting lives: 3.
- Each correct answer adds the question's `points`, increments the current streak and may update the run's best streak.
- Each incorrect answer adds zero points, resets the current streak to zero and removes one life.
- The run ends when lives reach zero or the selected question list is exhausted.
- The mode does not currently add a mode-specific win increment.
- The run's best streak is persisted as the maximum of the previous profile `stats.bestStreak` and the run best streak, when the run best streak is greater than zero.
- Shared XP/coin rewards use the final score.

### Time Trial

Source: `app/modules/quiz/modes/timetrial.js`, `app/modules/quiz/timer.js`, `app/modules/quiz/modes/base.js`.

- Maximum question count: 10; actual count is the number of selected questions after slicing.
- Each question has a 15-second countdown.
- A correct answer adds the question's `points`.
- A correct answer also adds a 5-point speed bonus when the displayed remaining seconds are strictly greater than 10.
- The displayed remaining seconds are calculated as `max(0, ceil((deadlineAt - now) / 1000))`. Therefore the current strict `> 10` test is equivalent to more than 10,000 milliseconds remaining.
- Timeout is treated as an incorrect answer: it adds no points and resets the feedback streak. The player can proceed to the next question.
- The mode ends after all selected questions have been processed.
- A win is recorded when `correctAnswers >= ceil(totalQuestions * 0.7)`; a win increments `wins` and `stats.totalWins`.
- Shared XP/coin rewards use the final score, including earned speed bonuses.
- In the trusted implementation, question deadlines and accepted answer timestamps must be server-authoritative. A client timer or client-reported `timeLeft` is presentation only.

### Daily Challenge

Source: `server/daily-challenge-service.mjs`, `server/authenticated-daily-challenge-handler.mjs`, `functions/index.mjs`, plus the Stage 1 audit.

- Daily Challenge is a separate server service, not one of the four standard `quizService` modes.
- Its current server completion path creates a score receipt; it does not credit competitive XP/coins.
- No prize-claim callable is exported by the current Functions entry point.
- Competitive prize claims remain disabled until the Stage 1 acceptance gate passes.
- The repository does not prove which Functions are currently deployed. Verify deployed Functions inventory before planning any production migration.

## Required trusted-backend invariants

These are migration/acceptance constraints, not new gameplay rules:

1. Derive player UID only from verified Firebase Auth context.
2. Keep canonical answer keys, AI outcomes, timers/deadlines, scores and reward calculations server-owned.
3. Validate mode, question IDs, answer order, option indexes, session ownership and session deadlines on every request.
4. Make answer submission, finalization, reward receipt and profile reward/stat updates transactionally safe and idempotent.
5. A retry of the same accepted operation must return the original result; a conflicting retry must not mutate the session or grant another reward.
6. Preserve existing mode-specific fields, including `stats.bestStreak` and win counters.
7. Do not switch browser flows or remove emulator guards until emulator and browser integration tests prove the complete flow.
8. Do not deploy production Functions or Firestore Rules based only on this document. Phase 0 evidence, deployed Functions inventory, backup/restore evidence and explicit release approval remain prerequisites.

## Explicit non-decisions

- No new AI difficulty behavior, tie-breaker or competitive multiplayer behavior is introduced here.
- No new scoring, reward, timeout, question-selection or progression rule is introduced here.
- Any mismatch between current source behavior and the approved V1 product specification must be raised as a decision/bug before implementation; do not silently choose one.
- The current Duel AI is a local probabilistic simulation, not a real-time human-versus-human duel.

## Source references

- `app/modules/quiz/modes/base.js`
- `app/modules/quiz/modes/classic.js`
- `app/modules/quiz/modes/duel.js`
- `app/modules/quiz/modes/survival.js`
- `app/modules/quiz/modes/timetrial.js`
- `app/modules/quiz/timer.js`
- `app/modules/quiz/rewards.js`
- `server/quiz-session-core.mjs`
- `server/quiz-service.mjs`
- `functions/index.mjs`
- `docs/audits/STAGE_1_SERVER_GAME_INTEGRITY_2026-11-20.md`
