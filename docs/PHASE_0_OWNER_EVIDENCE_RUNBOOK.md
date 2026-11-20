# Phase 0 — owner-run production evidence checklist

Date: 2026-11-20  
Project: quizhub-e65f5, Firestore database (default)  
Purpose: collect the remaining owner/operator evidence without changing production.

This runbook separates read-only evidence collection from the backup/restore rehearsal. Do not combine them into an unreviewed deployment.

## 1. Live Firestore inventory (read-only)

The guarded collector is located at functions/scripts/firestore-live-inventory.mjs. It:

- only accepts project ID quizhub-e65f5;
- requires explicit confirmation via QUIZHUB_CONFIRM_READ_ONLY_INVENTORY=YES;
- refuses to run when FIRESTORE_EMULATOR_HOST is set;
- reads Firestore recursively, including nested subcollections under missing parent documents;
- reports collection path patterns, document counts, missing parent-document references, field names and field types;
- does not include document IDs or field values;
- aborts rather than returning a partial report when its document/depth limit is exceeded.

The scan performs document reads and can incur Firestore read charges. The report still contains structural metadata (collection names and field names), so keep it private and do not commit it to this public repository.

### Windows PowerShell

Run from a fresh PowerShell terminal on the trusted owner/operator workstation.

1. Ensure Node.js 22 and Google Cloud CLI are installed.
2. Use the Google identity that has been granted the minimum required read-only Firestore permissions on the intended project. Do not create or download a service-account private key.
3. Authenticate Application Default Credentials interactively:

    gcloud auth application-default login
    gcloud config set project quizhub-e65f5

4. From the repository root, install the Functions dependencies if needed and run the collector:

    npm install --prefix functions

    Remove-Item Env:FIRESTORE_EMULATOR_HOST -ErrorAction SilentlyContinue
    Remove-Item Env:FIREBASE_AUTH_EMULATOR_HOST -ErrorAction SilentlyContinue
    Remove-Item Env:FUNCTIONS_EMULATOR -ErrorAction SilentlyContinue

    $env:QUIZHUB_PROJECT_ID = "quizhub-e65f5"
    $env:QUIZHUB_CONFIRM_READ_ONLY_INVENTORY = "YES"
    $env:QUIZHUB_INVENTORY_MAX_DOCS = "5000"
    $env:QUIZHUB_INVENTORY_MAX_DEPTH = "8"

    node functions/scripts/firestore-live-inventory.mjs |
      Tee-Object -FilePath ".\quizhub-firestore-inventory-private.json"

    if ($LASTEXITCODE -ne 0) {
      throw "Inventory did not complete. Do not use a partial report."
    }

The collector's default cap is 5,000 document references and maximum supported depth is 8. If it aborts at a cap, retain the error and stop. Review expected read volume and cost before increasing the cap; never treat a partial result as a complete inventory.

5. Keep the JSON report on the trusted workstation. Share it with the project owner/development team through a private channel or attach it to the private development conversation. Do not upload it to a public issue, PR, or repository.

### Evidence required for DATA-01

The report must include:

- complete: true;
- expected project ID and database ID (default);
- collection pattern inventory;
- document reference and existing-document counts;
- missing-parent counts;
- field/type summary;
- no document IDs or field values.

Review unexpected collection paths, nested/orphan subcollections, mixed field types and count changes before marking DATA-01 complete.

## 2. Active production Firestore Rules and indexes

The Rules text previously supplied by the owner is preserved in docs/audits/FIRESTORE_RULES_OWNER_SNAPSHOT_2026-11-20.md. Its provenance is owner-provided; it is not independently proven to be the active deployed Ruleset.

From Firebase Console for project quizhub-e65f5:

1. Open Firestore Database → Rules.
2. Copy/export the currently published Ruleset (not an editor draft).
3. Preserve the exact text and publication/version information privately.
4. Compare it byte-for-byte with the owner snapshot in the audit document. Record differences and the active Ruleset publication time.
5. Open Firestore Database → Indexes and export or record all active composite indexes and field overrides, including collection scope and status.
6. Share the Rules text and index export privately for review. Do not commit operational exports to the public repository.

Do not edit or publish Rules/indexes during this evidence step.

### Evidence required for DATA-01 / SEC-02

- Exact active Ruleset source and publication timestamp.
- Explicit comparison against the owner-provided snapshot.
- Active composite-index and field-override inventory.
- Confirmation of the Firebase project and (default) database.

## 3. Firebase Authentication configuration (AUTH-01)

In Firebase Console → Authentication:

1. Record enabled sign-in providers (Email/Password, Google, and any others).
2. Record authorized domains.
3. Confirm the project ID is quizhub-e65f5.
4. Do not enable/disable providers or alter domains during evidence collection.
5. Share the provider/domain list privately; redact user-specific information.

This verifies Console state only. Emulator tests do not prove production provider configuration.

## 4. Production backup and restore rehearsal (DATA-02)

This is a separate, explicitly approved owner/operator activity. The repository's backup capture/restore helpers are intentionally emulator-only and are not production export/import tools.

Before starting:

- identify the production Firestore database and all required collections/subcollections;
- select an isolated, access-controlled recovery project/database that is not the live production database;
- confirm the backup method captures the complete database and nested collections;
- preserve active Rules, indexes and relevant Auth configuration separately;
- estimate storage, export/import and read/write costs;
- agree on a maintenance/write-free window if the chosen backup method requires one;
- document the restore target and rollback procedure.

Rehearsal requirements:

1. Create a complete production backup using the approved Google Cloud/Firebase managed backup/export procedure.
2. Restore it into the isolated recovery environment, never over production.
3. Verify collection/document counts and representative nested/orphan subcollections.
4. Compare schemas and critical records using a privacy-safe verification report.
5. Verify that recovered application data is readable by the intended recovery environment.
6. Record start/end times, operator, backup/export identifier, restore target, warnings/errors and verification result.
7. Retain the backup and report according to the owner's retention policy.

Do not run a production restore command against quizhub-e65f5. Do not use the emulator-only restore helper as a substitute for this rehearsal.

### Evidence required for DATA-02

- Backup/export identifier and timestamp.
- Recovery environment identifier (not credentials).
- Confirmation that restore completed into the isolated target.
- Verification summary and unresolved differences.
- Rollback/recovery notes and operator sign-off.

## 5. Release gates

Phase 0 remains open until all four evidence groups are reviewed:

| Gate | Evidence | Status |
|---|---|---|
| DATA-01 | Complete live Firestore inventory, including nested/orphan subcollections | Blocked — owner/operator run required |
| SEC-02 | Exact active Ruleset and indexes export, compared with owner snapshot | Blocked — Console export required |
| AUTH-01 | Enabled providers and authorized domains | Blocked — Console verification required |
| DATA-02 | Production backup restored successfully into isolated recovery environment | Blocked — owner/operator rehearsal required |

Do not mark a gate complete merely because the collector or emulator tests pass.

## 6. Explicitly prohibited during this runbook

- No Firestore Rules or index deployment.
- No Functions deployment or production callable activation.
- No client migration or public-profile cutover.
- No production writes, migrations, deletions or cleanup.
- No collection of document IDs, user values, message contents or credentials in the public repository.
