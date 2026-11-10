# Phase 4 verification

10 November 2026. Scope: offline statement reconciliation and separate tax registers.

## Delivered

- CSV, XLSX, XLS and manually entered CSV: local worker parsing, worksheet selection, explicit column/date mapping, preview, integer-paise and running-balance validation, duplicate rejection, encrypted original evidence and downloadable source.
- Partial/grouped matching to posted bank movements, rechecked under a database write transaction. Different dates/references require a reason. Removing a match retains history.
- Exceptions retain owner annotations, reason, age and Open/Resolved state. Resolution does not implicitly reconcile money.
- Other bank movements record charges, interest and documented adjustments/reversals without creating receipt funding.
- Period locks require fully matched statements and book entries, resolved exceptions, exact contiguous statement coverage and agreeing opening/closing balances. Earlier balances and historical Society tax are protected. Reopening needs a reason, revision and confirmation; later locks must reopen first.
- Accountant-confirmed tax treatment versions (no assumed rate), explicit basis/effective dates, exact half-up calculation, expected/deducted/credited/set-off amounts, disputes, documented adjustments, project/department/receipt links and local PDF/image evidence. Tax events never create cash or payment funding.
- Schema 4 adds tables without replacing existing masters or financial history. No login or online runtime service.

## Validation

Verification commands: `npm run check`, `npm test`, `npm run test:ui`.
Backend tests: 32 passed. Browser suites: 45 responsive/axe checkpoints passed (33 existing and 12 Phase 4), with no external requests, browser errors or horizontal overflow. The Phase 4 suite was rerun after review fixes; it also checks UTF-8 CSV and rejection of oversized sparse worksheets. Hallmark static/rendered checks passed with 0 FAIL, 0 REFLEX and 0 WARN across 1280, 1440, 1920 and 375 widths.
Backend coverage includes read-only preview, invalid balances, duplicate import rollback, grouped/partial matching, cross-connection capacity checks, retained removed links, charge reversals, exceptions and locks, historical posting protection, tax limits, immutable evidence/history, effective rules and restart persistence.

The browser suite exercises real manual CSV and two-sheet XLSX imports, local evidence download, matching, charges, lock/reopen, tax configuration/credit/set-off and mobile layouts. External browser requests are blocked. Test records and screenshots are isolated in ignored temporary/artifact directories.

## Interface and review

The approved Furrow design remains unchanged. UI UX Designer, UI Styling and UI UX Pro Max guidance informs semantic forms, linked validation, clear amounts, confirmation and responsive density. Build Web Data Visualization guidance is applied through source-linked tables and exact amounts rather than decorative charts.

UIAudit's launcher remains unavailable following the checksum failure documented in Phase 2. Its bundled audit checklist is applied to source and browser evidence; this is not an automated detector pass.

CodeRabbit completed its review and raised 1 major issue: overlapping statement ranges with changed row content could leave unreconcilable duplicates. Fixed by rejecting overlapping periods inside the import transaction, showing the conflict in preview and disabling confirmation. Backend and browser regressions verify the changed-reference case. No reported issue remains unresolved.

The independent Hallmark reviewer reinspected the corrected tax screenshots and returned **ship**, confirming both original UI findings resolved.

Hallmark's independent finish review raised two issues: irrelevant tax-event fields and indistinguishable evidence filenames. Both were fixed: event type controls which fields are enabled, and evidence links carry purpose/reference. Import sections also have consistent spacing; exceptions show age and status. UIAudit checklist assessment: accessibility 3/4, performance 3/4, responsive 3/4, theming 3/4, integrity 3/4 (15/20). Evidence is the browser suite, source checks and actual screenshots; large-volume profiling and full assistive-technology certification remain release work.

## Policy and boundaries

Statement files require a header and separate debit/credit columns, up to 2 MB and 2,000 data rows per import. Split larger statements into consecutive periods with carried balances. No bank-specific format is assumed. The original file and confirmed mapping are retained; imports do not silently post missing cash movements.

Tax configuration must be based on actual accountant confirmation; the application supplies no tax-law determination or default 2% assumption. Owner names and approvals are local annotations, not authenticated identities. Evidence format checks are not malware scanning. All libraries are bundled locally. Installed Node is required until Phase 6. Reports/exports remain Phase 5; portable distribution and backup/restore remain Phase 6.
