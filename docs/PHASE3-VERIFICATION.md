# Phase 3 verification

9 November 2026. Scope: offline claims, outward payments, receipt allocation, labour batches and reversals. Phase 4 remains pending owner review.

## Delivered and acceptance coverage

- **AC-04:** Supplier, sub-contractor, labour-contractor and individual-labour claims; category-specific invoice/work/wage metadata; gross, GST-included amount, TDS, retention and other deductions; immutable approved claim terms; local payment evidence and unique outward IDs.
- **AC-05:** Multiple distinct instalments against one claim and receipt, with net payable, posted/remaining amounts and full/part-paid indicators.
- **AC-06:** One outward debit can use multiple receipt IDs; distributions and allocations must each equal the exact bank debit. Labour batches create one debit with multiple beneficiary claim rows.
- **AC-07:** Atomic posting rechecks claim pending, receipt availability, current scope, duplicates and every resulting bank-book running balance. Concurrent browser requests and a second database connection cannot overspend shared funding.
- **AC-11:** Original posted records remain immutable. Unique linked reversals restore balances once, with confirmation, reason, date and evidence reference. Corrected payments link to their original. Failed/cancelled unposted instructions never affect balances.
- **Offline amendment:** No accounts, login, network API, external assets or new runtime packages. Submit/approve/post are explicit local decisions, not authenticated multi-user approvals.

## Verification evidence

- `npm run check`: passed, including both new payment modules.
- `npm test`: 25 passed. Includes instalments, exact net deductions, split funding, multi-beneficiary batches, rollback after injected allocation failure, duplicate and scope rejection, stale transitions, two-connection posting, concurrent HTTP tabs, full reversals, refund-date restrictions, identical-timestamp ledger ordering, encrypted evidence access, restart persistence and preservation of Phase 2 data during migration.
- `npm run test:ui`: 33 responsive/axe checkpoints passed, zero external requests, zero page exceptions and no horizontal overflow. Exercises master and receipt regressions; claim approval; payment draft/evidence/submit/approve/post; receipt drill-through with reversed-payment history; reversal and correction link; desktop/mobile registers; bank debits; and a two-worker batch producing exactly one bank movement.
- Hallmark static/rendered checks: 0 FAIL, 0 REFLEX, 0 WARN. Rendered new payment entry at 1280, 1440, 1920 and 375 widths. Test screenshots are example data in ignored `artifacts/`; no sample records are installed in the user's database.
- CodeRabbit: two completed reviews. The first raised 0 issues; the final pass raised 1 minor issue in the reversed-receipt notice. The notice and status label were corrected, and the browser suite now verifies a full receipt reversal without draft-only text. No reported issue remains unresolved.

## Interface review

Hallmark's independent fresh-context review identified four practical issues. All were fixed and recaptured: selected funding balances now wrap below mobile selectors; bank-book mobile labels match Date/Transaction; receipt funding has section spacing; the sidebar describes receipts, claims and payments. The reviewer confirmed the established Furrow theme and native controls fit the application.

UI UX Designer, UI Styling and UI UX Pro Max guidance is retained in semantic labels, explicit monetary state, local confirmations, usable errors and responsive rows. Build Web Data Visualization guidance is applied through real INR text, claim balances, beneficiary schedules and linked ledger tables; no decorative chart is introduced.

UIAudit's engine remains unavailable following the checksum-verification failure recorded in Phase 2; no unverified binary was run. Its bundled technical audit checklist was applied to source and browser evidence. This is not an automated detector result.

| Dimension | Score | Evidence / limitation |
| --- | --- | --- |
| Accessibility | 3/4 | 33 axe checkpoints; labelled controls, visible focus, confirmation checkboxes, live funding summaries. Full assistive-technology certification remains release work. |
| Performance | 3/4 | Local modules, no chart/runtime packages. Large financial-register pagination and scale profiling remain Phase 6 work. |
| Responsive | 3/4 | Desktop/mobile payment and batch forms, readable wrapped funding balances, stacked ledger records; native inline links remain compact. |
| Theming | 3/4 | Shared tokens and offline system font; light theme only. |
| Integrity | 3/4 | Product-specific funding/distribution controls, no fake metrics, immutable posted states; detector unavailable. |
| Total | 15/20 | Good. No observed blocking UI issue. |

## Explicit policy and boundaries

Same Society, project and bank account only; no unallocated residual or cross-account funding. All payment amounts require review, regardless of size. Draft/submitted/approved records do not reserve funds. A labour batch contains approved labour claims only. Receipt reversals require all funded payments to be reversed first. Reused funding cannot be backdated before the latest linked payment reversal. Negative historical or later bank balances are blocked.

Cash mode records an evidenced bank-funded debit, not an independent petty-cash book. Tax deduction fields are stored without statutory automation. Reversal references are local annotations and confirmation, not a live bank verification. Evidence is format-screened, not malware-scanned. Installed Node is still needed until the offline distribution in Phase 6. Reconciliation, tax registers, reports and backup/restore tooling remain in their planned phases.
