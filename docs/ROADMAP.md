# FundTrace six-phase delivery plan

Baseline: Labour Society Payment Tracking PRD v1.0, dated 7 November 2026. **Owner amendment:** the complete application must work entirely offline and must have no login system or login page. This amendment supersedes PRD authentication, user-role and remote-service assumptions. Delivery is a local single-user application; change history identifies the local workspace, not an authenticated person.

| Phase                         | Working deliverables                                                                                                                                                                                    | Exit criteria                                                                                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Offline foundation         | Direct local launch, persistent encrypted SQLite storage, Society/department/project/bank/beneficiary masters, immutable numbering, change history, responsive registers                                | Create/edit linked masters; validate values/duplicates; preserve IDs/history; no login; all flows work with external requests blocked and survive restart. AC-01, AC-02; local privacy replaces role-based AC-12. |
| 2. Government receipts        | Inward drafts/posting, Payment IDs, bill/project mapping, credit/value dates, local evidence attachments, duplicate controls, receipt detail and bank-credit ledger                                     | Only posted receipts increase cash and allocatable balances; IDs never reused; net bank credit is distinct from gross bill/tax amounts. AC-03 and receipt portions of AC-08/11.                                   |
| 3. Payments and allocation    | Supplier/sub-contractor/labour claims and instalments, batches, split receipt funding, posting review/confirmation, atomic allocation, failures, reversals and corrections                              | No over-allocation even with multiple local browser tabs; allocations equal posted debit; batch schedules do not double-count cash; corrections preserve originals. AC-04–07 and AC-11.                           |
| 4. Reconciliation and tax     | Local CSV/Excel/manual statement import, matching, exceptions, period locks, other bank movements, configurable tax deduction/credit/set-off registers                                                  | Reconciliation ties to evidence; exceptions require recorded reasons/confirmation; tax credit never increases cash or receipt funds. AC-09 and PRD §8–9.                                                          |
| 5. Search and reports         | Real posted-data dashboard, global filters, Payment ID 360, linked local evidence, monthly/Indian-FY reports, offline XLSX/PDF/print                                                                    | Source drill-through and consistent date basis; readable exports with filters/totals/period; all chart/export libraries bundled locally. AC-08 and AC-10.                                                         |
| 6. Offline release validation | Complete acceptance/regression/concurrency tests, accessibility and performance checks, local backups and restore, portable offline distribution with bundled runtime, instructions and stakeholder UAT | Full installation/startup/data-entry/search/report/export/restore works with internet disabled; all retained acceptance criteria pass; no critical/high defects; owner accepts the result.                        |

## Phase completion contract

Implement and test each complete phase, use CodeRabbit for development-time review, address actionable issues, document verification, commit and push. Stop for the owner's review before the next phase. GitHub/CodeRabbit/CI require development connectivity only; none is called by the app at runtime.

## Business rules retained

Stable UUIDs and public references; exact integer paise; Indian FY April–March; cash and tax kept separate; drafts excluded from posted totals; immutable posted history with reasoned reversals; supporting evidence; masked general views; atomic financial writes; local backups. Master changes retain revision checks and encrypted before/after snapshots. Deactivation replaces deletion.

## Offline interpretation of approvals and audit

No users, roles, passwords, sessions, MFA or login will be added. Later approval/override workflows become explicit local review/confirmation with reason and evidence. They do not claim independent authorization or separation of duties. Any reviewer name entered is a record annotation, not verified identity. Original PRD AC-12 user-permission restrictions are superseded; local privacy, masking and operating-system file access form the revised boundary.

## Decisions needed before later phases

1. Phase 2: receipt ID format, bank reference uniqueness, bill handling and local document limits.
2. Phase 3: cross-project/cross-account funding rules, unallocated-funding exceptions, local confirmation thresholds and labour batch records. Default: no unallocated funding.
3. Phase 4: accountant confirms the referenced 2%, calculation basis/evidence/effective dates; sample bank statement formats and period-lock policy.
4. Phase 5: report date basis and export content/masking choices.
5. Phase 6: target Windows versions, portable/installer preference, expected volume, local data/backup locations, retention, recovery targets and UAT owner.

No payment initiation, statutory general ledger/payroll/return filing, tax/legal advice, online bank feeds, cloud backup, remote notifications or work-execution management is in scope. The product records payments already made; its operation never depends on the internet.
