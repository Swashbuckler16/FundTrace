# Phase 6 release verification

Date: 11 November 2026. Release: 1.0.0, Windows x64 portable candidate. The application remains completely local, single-workspace, without login or runtime internet dependencies.

## Delivered

- Manual and daily automatic SQLite backups with the encryption key, attachments and SHA-256 manifest. A copy is published only after integrity, foreign-key and encrypted-payload verification. Last backup, local paths, privacy guidance and errors are visible in Backup & recovery.
- Offline restore launcher with exact RESTORE confirmation, preflight/staged validation, retained previous directory, recovery audit entry and protection against interrupted swaps. A live workspace lock blocks restore/duplicate servers; stale unlock checks the recorded process.
- Portable Windows package with official checksum-verified Node 24.20.0, runtime license/provenance and local instructions. No package installation or Node on PATH is required. The build excludes private workspace data and design captures.
- CI regression and a Windows portable build/smoke test; the ZIP is available as the FundTrace-Windows-x64 Actions artifact. Source checkout startup remains supported.

## Evidence and acceptance mapping

| Requirement | Verification |
|---|---|
| AC-01/02 master data, stable IDs and numbering | Foundation tests; complete master-data browser workflow; restore round-trip compares records and numbering |
| AC-03 receipt cash and Payment IDs | Receipt suite: drafts excluded, posting/date/FY/duplicate/evidence validation, persistence |
| AC-04/05/06 payments, instalments, split funding and labour batches | Payment suite and browser workflow: exact paise, distribution/allocation equality, one debit per batch |
| AC-07 concurrent allocation | Independent database connections and simultaneous HTTP posting; one conflicting write is rejected and no capacity is exceeded |
| AC-08/10 trace, dashboard, reports and export | Reports suite, all 11 report types, exact/partial search, source links, all-row Excel export, numeric/calendar-date/formula safety and actual rendered PDF |
| AC-09 reconciliation and tax | Statement preview/import, partial/grouped match, exceptions, lock/reopen, charge/reversal and tax-event tests; tax never increases cash |
| AC-11 correction history | Immutable posting and linked reversal tests; before/after audit persistence; restore records recovery |
| AC-12 amended offline privacy | No login; masked views/reveal audit, AES-GCM payloads, Host/Origin/write-header boundaries and local-only attachments |
| Backup/recovery | Live WAL snapshot, exact restore including key/evidence/numbering, corrupt checksum/wrong key/future schema rejection, lock refusal, interrupted recovery retry |
| Offline release | Bundled Node startup with PATH empty; local save, backup, stop/crash-unlock, CLI restore and restart. Browser suites block all external requests |

The source regression suite contains **47 backend tests**. Browser verification covers **68 responsive/axe checkpoints** (33 foundation/payments, 12 reconciliation/tax, 18 reports/exports, 5 recovery). Automated axe checks cover WCAG 2 A/AA and 2.1 AA rules; this is not full screen-reader certification. The native browser print dialog and Windows extraction/launcher interaction also remain in the owner checklist.

Performance baseline on this Windows development machine, Node 26.13.0, 1,000 posted receipts and 100 posted payments with small test attachments: exact Payment ID search **266 ms**, receipt register **120 ms**, consolidated summary **178 ms**, complete verified backup **1,012 ms**. PRD targets are generally 2 seconds for exact lookup and 3 seconds for common lists/details at normal volumes. This baseline supports that tested workload; it is not a guarantee for arbitrary attachment sizes, slower disks or much larger databases. Reproduce with `npm run test:performance`. No speculative cache or new runtime dependency was added.

## UI and code review

Ponytail was applied throughout: existing native forms/tokens, SQLite snapshot, filesystem rename and bundled Node APIs, no additional runtime packages. The synchronous backup ceiling is explicitly marked in source. UI Styling, UI UX Pro Max, UI UX Designer and Build Web Data Visualization guide meaningful labels, confirmation/recovery, mobile tables and direct date/path/size text; no decorative charts are added. The existing Furrow theme is retained.

Hallmark static check: zero FAIL/REFLEX/WARN. Render check: zero FAIL, one existing F19 four-weight warning; the established 400/500/600/700 wordmark/financial hierarchy is retained. Independent finish review found no hard-gate failures and suggested clearer dated-folder wording and spacing before saved backups; both refinements were applied and recaptured.

UIAudit's binary could not be used after the previously documented checksum-verification failure. Its bundled checklist was applied to actual source and browser evidence; no automated UIAudit detector pass is claimed.

CodeRabbit completed the release review and raised 4 issues: 1 major and 3 minor. The major issue was a pending-restore marker left behind after a failed swap with a successful rollback; normal failure now restores availability, while ambiguous rollback failures retain the marker and original data. The minor issues were missing checkbox error-link semantics, failed backup staging accumulation, and an unfinished review-status sentence. All four were addressed. New fault-injection tests cover original/staged/rollback rename failures and failed manifest/verification cleanup; the browser test clicks the confirmation error link and verifies focus. No reported issue remains unresolved.

## Remaining owner acceptance

The implementation and automated release checks do not sign stakeholder UAT. The owner must complete the physical-network-disconnection workflow in [OFFLINE-GUIDE.md](OFFLINE-GUIDE.md), confirm the accounting/date/approval interpretation against actual work, and record the release checksum, reviewer/date and outcome before live adoption. No Windows version other than the tested Windows 11 x64 environment is certified. Keep private data outside the repository/OneDrive and test an external backup restore at least quarterly and before upgrades. No known critical/high defect may remain open at acceptance.
