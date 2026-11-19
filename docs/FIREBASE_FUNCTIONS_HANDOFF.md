# QuizHub — Firebase Functions handoff

Status: **prepared, compiled in CI, NOT deployed**.

## Scope

- Project: `quizhub-e65f5`
- Firestore: `(default)`, STANDARD, `eur3`
- HTTPS callable: `dailyChallenge`, configured for `europe-west1`
- Source status: Functions code and emulator integration are present in `main`; deployment status remains **NOT DEPLOYED**.
- Browser Daily Challenge remains **practice-only** with no rewards or rank.

The callable accepts `{ operation, payload }`, with operations `start`, `resume`, `answer`, `complete`. The authenticated UID is read from Firebase Auth context and the time is generated on the server. Do not supply those fields from clients. No prize/leaderboard sealing or award API is exposed yet.

## Local compilation

With Node.js 22 installed:

```sh
npm install --prefix functions
npm run --prefix functions build
npm run --prefix functions check
```

The bundle contains the question catalog and answer keys **on the server only**. Do not serve or copy `functions/dist/` into browser assets.

## Local emulators (no production writes)

After building, run the emulators with an explicit demo project:

```sh
npx -y firebase-tools@latest emulators:start --only auth,firestore,functions --project demo-quizhub
```

Use the Auth emulator to sign in test users and call `dailyChallenge` with a Firebase Functions client connected to the Functions emulator. The Firestore and Auth emulators must run at the same time; without them the Admin SDK could connect to real resources.

The **Firebase emulator integration** GitHub Actions workflow boots Auth, Firestore Standard and Functions emulators under `demo-quizhub`, creates test identities, invokes the callable over HTTP, and verifies authentication, forged identity rejection, independent attempts, persisted answers, retries and error mapping. Emulator success is not evidence of a production deployment. This verifies the network boundary, but is **not** production sign-in or a complete release test.

## Security and migration gates

1. Confirm Firebase billing/Blaze availability for second-generation Cloud Functions.
2. Check the functions service identity has narrowly scoped Firestore access. The GitHub OIDC CI identity currently has **no Firestore or deployment role**.
3. Verify `dailyAttempts`, `dailyReceipts`, `dailyRankings`, and `dailyPrizes` collections do not conflict with existing user data.
4. Expand emulator testing to simultaneous writes, failure recovery, UTC rollover and full ten-question completion (basic replay and persistence smoke tests now pass).
5. Migrate client session entry to the callable, remove competitive access to client-side answer keys, and retire direct client economy writes.
6. Audit and test restrictive Firestore Security Rules **before** enabling ranked rewards.
7. Deploy only after explicit release approval. Never use an unscoped `firebase deploy` command here.

Existing `users/{uid}` profiles are preserved by the adapter: prize updates touch only `experience`, `weeklyExperience`, and `coins`. Production access and recovery settings must be reviewed separately.
