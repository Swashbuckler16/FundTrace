# FundTrace six-phase delivery plan

Baseline: Labour Society Payment Tracking PRD v1.0, dated 7 November 2026, provided by the project owner. The six phases below replace the PRD's suggested four-phase delivery sequence while preserving its functional requirements. Complete and verify one phase, commit and push it, then wait for the owner's instruction before starting the next.

| Phase | Working deliverables | Exit criteria / PRD coverage |
| --- | --- | --- |
| 1. Foundation | Authentication, five roles, Society access scopes, Society/department/project/bank/beneficiary masters, immutable master IDs, change history, user administration, responsive setup workspace | Create/edit Society without changing identity; create a department and linked work order; validate master data; mask and encrypt private details; test authorization and audit controls. AC-01, AC-02, foundation of AC-12. |
| 2. Government receipts | Draft and posted inward receipts, atomic Payment ID series, bill references, project-pending mapping, bank/value dates, evidence uploads, duplicate-reference controls, receipt detail and bank-credit ledger | Posting credits cash exactly once; drafts do not fund payments; IDs never reused; actual net cash is separate from gross bill and deductions. AC-03 and receipt portions of AC-08/AC-11. |
| 3. Payments and allocation | Supplier/sub-contractor/labour claims, instalments, batch distribution schedules, drafts/submission/approval/posting, split receipt funding, atomic balance checks, failures, reversals, corrections and approvals | Allocations equal posted payment; concurrent over-allocation fails; batch schedules do not duplicate bank debits; originals remain immutable. AC-04–07, AC-11, approval aspects of AC-12. |
| 4. Reconciliation and tax | Controlled CSV/Excel/manual statement import, matching and exceptions, period locks, other bank movements, effective-dated tax configuration, separate deduction/credit/set-off records | Reconciled records tie to evidence; controlled exceptions are approved and audited; tax credit never changes bank cash or available receipt funds. AC-09, reconciliation requirements in §8 and §9. |
| 5. Search and reporting | Dashboard with real posted totals, global filters, Payment ID 360 and linked evidence, report catalogue, monthly/Indian-FY statements, XLSX/PDF/print exports with permission-aware masking | Every summary drills through to source records; totals share an explicit date basis; exports include filters, period, units and generation time. AC-08, AC-10, export aspects of AC-12. |
| 6. Release validation | Full acceptance and regression testing, concurrency/load tests, security and accessibility review, backup/restore exercise, retention/recovery settings, deployment, operational runbook, training and stakeholder UAT | All AC-01–12 pass end to end against deployed code; unresolved critical/high issues are zero; restore demonstrably succeeds; owner accepts tested workflows. Production completion depends on agreed hosting and policy inputs. |

## Per-phase completion process

Implement the complete phase scope, run relevant automated and browser checks, run CodeRabbit review, address actionable issues, document verification and known limits, then commit and push to the supplied repository. The user reviews the result before the next phase starts. A review service failure is recorded as a limitation, never described as a pass.

## Phase 1 choices

- Local-first, same-origin Node.js application and SQLite persistence; vanilla JavaScript UI with semantic native controls and CSS tokens. No client-side financial storage or runtime CDN dependency.
- Admin manages all records/users; Accountant creates/edits projects and beneficiaries within assigned Societies. Other roles view permitted records. Departments are shared reference data. Non-admin accounts have no Society access until explicitly assigned.
- All master changes retain immutable UUIDs, sequential public IDs, revision numbers, actor, timestamp, reason and encrypted before/after snapshots. Deactivation replaces deletion.
- Account numbers and other sensitive master details are masked by default. Admin and Accountant can request restricted details; the request is audited.
- Currency and percentages use integer minor units; input with more than two decimal places is rejected. No GST default of 2% is assumed.
- Numbering page shows issued master counters and **proposed** receipt/payment formats. Financial numbering and transactions activate in Phases 2–3.
- Existing records remain linked after rename/deactivation; edits use optimistic concurrency checks. Project IDs, department and Society relationships are validated server-side.
- Phase 1 provides setup counts rather than invented balances/charts. Production bank ledger, claims, attachments, posting, approvals, project-specific permission scopes, tax treatment and reporting are later-phase work.

## Open decisions and latest required phase

1. Before Phase 2: confirm receipt ID format, reference uniqueness, bill handling and evidence limits.
2. Before Phase 3: confirm approval delegation/thresholds, same-bank funding, cross-project funding, unallocated-funding exceptions and labour wage/batch records. Default is no unallocated funding.
3. Before Phase 4: accountant confirms the meaning of the referenced 2%, tax basis/evidence/effective dates; provide sample bank import formats and period-lock policy.
4. Before Phase 5: confirm report date basis and permitted exports.
5. Before Phase 6: hosting, expected data/user volumes, project-level scopes, HTTPS/domain, MFA policy, retention, backup retention, RPO/RTO and acceptance owner.

Out of scope throughout: payment initiation, internet banking credentials, statutory general ledger/payroll/return filing, legal/tax advice and work execution management (§3.3). No later-phase functionality is implied by the Phase 1 release.
