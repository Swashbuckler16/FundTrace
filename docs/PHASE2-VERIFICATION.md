# Phase 2 verification

Completed 8 November 2026. Scope: offline Government receipts and the CI runner fix. Phase 3 remains unimplemented pending owner review.

## Delivered

- Receipt drafts, scoped Society/department/project/bank selection, bill metadata, separate credit/value dates and payment references.
- Positive confirmed bank credits, immutable Society/credit-financial-year Payment IDs, exact paise and atomic posting/audit/ledger writes.
- Duplicate reference, cheque or amount/date checks on the same bank account; explicit confirmation and documented override for a separate credit.
- Local encrypted PDF/PNG/JPEG evidence, bounded uploads and attachment-only downloads.
- Receipt detail/activity, URL-backed register filters and bank book with running balances. Drafts and tax figures never increase cash.
- Posted receipt/evidence locks, stale-write rejection and locked bank opening fields after posting.
- CI pinned to Ubuntu 24.04 because the previous `ubuntu-latest` image selected Ubuntu 26.04, unsupported by the pinned Playwright 1.56.1 browser installer.

## Automated evidence

- `npm run check`: passed.
- `npm test`: **15 passed**, including rollback on simulated ledger failure, two-connection posting protection, duplicate override, revision conflict, encryption, download boundaries and restart persistence.
- `npm run test:ui`: **17 responsive/axe checkpoints passed**, no browser exceptions, no horizontal overflow and zero external requests with external browser traffic blocked. Covers Phase 1 regression plus draft → missing-evidence rejection → upload → post → bank book, filters/reload, desktop and mobile.
- CodeRabbit CLI review of the staged implementation: **0 issues**, completed successfully across 11 changed files.
- Hallmark static and rendered checks: **0 FAIL, 0 REFLEX, 0 WARN**. Rendered receipt entry at 1280, 1440, 1920 and 375 widths. Screenshots/results remain in ignored `artifacts/` and `.hallmark/shots/`.

## UI review

The established Furrow design and local system font are retained. UI UX Designer/UI Styling/UI UX Pro Max guidance is applied through semantic labelled controls, explicit states, scoped choices, accessible errors and responsive tables. Build Web Data Visualization guidance is represented by real values and linked tabular bank entries; no decorative or synthetic charts.

UIAudit engine setup failed checksum verification: `cannot verify ...impeccable-windows-x64.exe against ...impeccable-windows-x64.exe.sha256; refusing the unverified download`. The engine was not run or bypassed. The bundled technical audit checklist was applied with source inspection and browser evidence, separately from automated detector claims:

| Dimension | Score | Evidence / limitation |
| --- | --- | --- |
| Accessibility | 3/4 | 17 axe checks pass; labels, confirmation checkboxes, focus and linked validation. No full assistive-technology certification. |
| Performance | 3/4 | Local assets and no runtime packages. Large-register pagination and scale profiling remain future work. |
| Responsive | 3/4 | Desktop/mobile receipt and bank-book screens pass overflow checks. Inline links use native text sizing. |
| Theming | 3/4 | Shared tokens and offline system font; light theme only. |
| Integrity | 3/4 | No fabricated figures, drafts visibly excluded, explicit post action; detector unavailable. |
| Total | 15/20 | Good; no observed blocking UI defect. |

Hallmark fresh-context finish reviewer could not run because the agent hit its usage limit. An in-thread fallback inspected receipt entry/register at 375px and receipt draft at desktop: hierarchy, labels and monetary state are clear; the locked theme is preserved. This is not claimed as an independent review.

## Intentional boundaries

No login or internet service is used by the app. Installed Node and a browser are still required until Phase 6 bundles the runtime. Evidence is format-screened, not malware-scanned. Mapping/evidence may be incomplete in drafts, but must be complete before posting. Posted reversals/allocations arrive in Phase 3; reconciliation/tax registers in Phase 4; full reports in Phase 5. Opening balances plus receipt credits are not yet a complete reconciled bank statement.
