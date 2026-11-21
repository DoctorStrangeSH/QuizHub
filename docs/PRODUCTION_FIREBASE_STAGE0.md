# QuizHub — Production Firebase Stage 0 runbook

**Status:** blocked / evidence collection only  
**Project:** `quizhub-e65f5`  
**Database:** `(default)`  
**Last source audit:** 2026-11-21

This runbook is deliberately read-only until the owner has supplied and reviewed the live configuration evidence. Do not deploy Rules or Functions, change Auth settings, run migrations, backfill documents, or change `PUBLIC_PROFILE_READS_ENABLED` as part of Stage 0.

## 1. Repository facts verified on `main`

- `firebase.json` configures Functions, emulator ports and `firestore.indexes.json`, but does **not** declare a `firestore.rules` source.
- No root `firestore.rules` file exists in the audited revision.
- No `.firebaserc` project-alias file exists in the audited revision. The client config identifies `quizhub-e65f5`, but the Firebase CLI deployment target is not pinned by repository configuration.
- `firebase.rules-preview.json` points to `tests/fixtures/quiz-sessions.rules`; this is a narrowly scoped emulator preview for server-owned quiz-session access, **not** the deployed production Rules source and not a complete application Ruleset.
- `functions/scripts/firestore-live-inventory.mjs` is an explicit-confirmation, read-only Admin SDK collector. It rejects emulator mode and any project other than `quizhub-e65f5`. Reads may incur Firestore charges.
- CI backup/restore rehearsals run against disposable `demo-quizhub` emulators. They do not constitute a backup of the production database and do not prove production restore readiness.
- The README and `docs/ECONOMY_SECURITY.md` state that the browser currently writes economy fields directly to `users/{uid}`; trusted reward services and callable endpoints are preparation only and remain emulator-guarded.

## 2. Evidence required from Firebase Console

Collect these items without changing settings:

1. **Firestore → Rules:** copy the exact currently published Rules text. Include the Rules tab's published/updated timestamp if visible.
2. **Firestore → Indexes:** export or capture the complete composite-index configuration and any relevant single-field exemptions. Compare it with repository `firestore.indexes.json`; do not assume they match.
3. **Firestore → Data:** record the top-level collections and known nested collections. Do not share document contents, emails, message bodies, tokens, or other personal data in screenshots.
4. **Authentication → Sign-in method:** list enabled providers (only provider names and enabled/disabled state).
5. **Authentication → Settings → Authorized domains:** list the configured domains.
6. **Project settings:** confirm project ID `quizhub-e65f5`, database `(default)`, and region/location. Do not share service-account private keys, API secrets, recovery codes, or credentials.
7. **Backup evidence:** identify the current production backup/export method, destination, retention, last successful export and restore procedure. A backup is not accepted until a restore has been tested in an isolated disposable environment.

Prefer text exports over screenshots where possible. Redact personal data and secrets.

## 3. Optional live schema inventory (read-only, owner-operated)

The repository collector is designed to enumerate collection paths and field names/types without returning document IDs or field values. It is not a backup and is not a replacement for the Console evidence above. It performs reads and may incur charges.

Run only if the owner explicitly approves the read-only production scan and has configured Google Application Default Credentials with least-privilege read access.

PowerShell, from the repository root:

```powershell
$env:QUIZHUB_CONFIRM_READ_ONLY_INVENTORY = "YES"
$env:QUIZHUB_PROJECT_ID = "quizhub-e65f5"
$env:QUIZHUB_INVENTORY_MAX_DOCS = "5000"
$env:QUIZHUB_INVENTORY_MAX_DEPTH = "8"

# Ensure no emulator endpoint can redirect or contaminate the scan.
Remove-Item Env:FIRESTORE_EMULATOR_HOST -ErrorAction SilentlyContinue
Remove-Item Env:FIREBASE_AUTH_EMULATOR_HOST -ErrorAction SilentlyContinue
Remove-Item Env:FUNCTIONS_EMULATOR -ErrorAction SilentlyContinue

npm install --prefix functions
node functions/scripts/firestore-live-inventory.mjs
```

Save the JSON report privately. Review it for completeness and do not commit raw inventory output: even schema metadata can reveal sensitive system structure. If the script aborts on caps or errors, treat the result as incomplete; do not increase limits or rerun without reviewing expected read volume and cost.

## 4. Release gates — all must be satisfied

- [ ] Exact deployed Firestore Rules exported and reconciled with source.
- [ ] Exact deployed index configuration exported and reconciled with source.
- [ ] Auth providers and authorized domains recorded.
- [ ] Read-only live collection/schema inventory complete, or an owner-approved alternative documented.
- [ ] Production backup/export completed, integrity verified, retention confirmed, and restore rehearsed outside production.
- [ ] Existing users, nickname claims, public profiles, economy, achievements, friendships and nested chat messages accounted for.
- [ ] Every client read/write path mapped to the intended Rules permission.
- [ ] Emulator adversarial tests cover owner, other-user, anonymous and unauthenticated access plus all V1 query shapes.
- [ ] Migration/backfill plan is idempotent, resumable, collision-safe and has a tested rollback.
- [ ] Client cutover is coordinated so the existing app is not broken by new Rules.
- [ ] Explicit owner approval for the production deployment window and rollback plan.

## 5. Non-negotiable safety boundary

Until every release gate is met and explicitly approved:

- do not create a guessed production Rules file from old chat snippets;
- do not add a `firestore.rules` mapping to `firebase.json` that might deploy unverified rules;
- do not run `firebase deploy`, production Functions deployment, backfills, migrations or write scripts;
- do not turn on public-profile reads;
- do not claim client-side field projection provides network-level privacy;
- do not treat emulator backup/restore tests as a production backup.

**Stage 0 output:** a reviewed evidence pack and an approved, repository-owned source of truth for the actual deployed Firebase configuration. Only then design the production Rules and migration PR.
