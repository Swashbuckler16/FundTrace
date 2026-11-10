# Offline architecture, Phases 1–3

Browser on this computer → loopback-only HTTP/JSON → validation → transactional local SQLite.

`public/app.js` owns URL-backed views, filters and semantic forms. `src/server.mjs` serves local assets and validates local Host/Origin/write-header boundaries. `src/domain.mjs` validates masters, exact monetary input and financial years. `src/store.mjs` owns persistence, numbering, revisions and audit. `src/security.mjs` encrypts/redacts private payloads. No runtime npm packages or external resources are needed.

## Persistence

- `records`: immutable UUID/public ID, entity kind, Society/department foreign keys, indexed name/status, encrypted payload, revision and timestamps.
- `series`: monotonic counters allocated in the same transaction as record creation.
- `audit`: append-only action/entity/Society/time/reason and encrypted before/after snapshots. Actor is `Local workspace`, not an authenticated identity.

There are no user, login, password or session tables in the offline schema. All local master records are available to the computer's user. API parameters cannot choose an audit actor. SQLite WAL, foreign keys, busy timeout and `BEGIN IMMEDIATE` protect consistency; optimistic revisions prevent silent overwrites between local browser tabs.

## Local boundary

Production entry binds only to `127.0.0.1`; there is no configurable network host. Requests require the actual localhost/127.0.0.1 authority and port. Cross-site Origin/Fetch-Metadata requests fail. Writes require same-origin JSON plus the custom `X-FundTrace-Local` header; CORS is not enabled. These protections stop ordinary external websites and DNS-rebinding from using the unauthenticated local API. They do not restrict trusted local programs or someone with computer access.

Encrypted payloads protect against a database-only disclosure, not compromise of both database and local encryption key. Operating-system access and private backups are the appropriate controls for this no-login app. The local key is generated once; startup refuses to replace a missing key beside an existing database.

## Delivery and future phases

The app runs with installed Node 24.14+ and a browser, without `npm install`. Phase 6 bundles the runtime for offline distribution and validates a disconnected installation. All attachment storage, statement parsing, charts, XLSX/PDF generation and recovery tools in future phases must be local. No cloud authentication, analytics, CDN fonts or background network calls are permitted.

Schema version 2 adds receipts, encrypted evidence and bank entries without replacing Phase 1 master data. `src/receipts.mjs` implements receipt validation and storage methods. Drafts have optimistic revisions and no Payment ID. Posting validates current master scope, evidence and duplicate candidates inside `BEGIN IMMEDIATE`, then assigns the Society/credit-year sequence, locks the receipt, inserts exactly one bank entry and appends audit history in the same transaction. Any failure rolls everything back. Database triggers prevent posted receipt updates and ledger mutation/deletion. Bank opening fields lock once an entry exists.

Evidence is stored as encrypted base64 in SQLite, not at user-supplied filesystem paths. Uploads require a plain name, supported PDF/PNG/JPEG signature, a 2 MB decoded size limit and at most five files per receipt. The evidence route alone accepts JSON up to 3 MB; other writes remain limited to 64 KB. Downloads use attachment disposition, nosniff and a sandbox CSP. Signature checks are format screening, not malware scanning. Back up the database and its original key together.

## Phase 3 financial model

Schema version 3 additively creates `claims`, `payments`, `distributions`, `allocations`, `payment_evidence` and `reversals`; existing masters, receipts and ledger rows are retained. `src/payments.mjs` owns transitions, allocation validation, reversal controls and the combined bank book. `public/payments.js` implements claim/payment forms and details using the shared local UI helpers.

Claim net = gross − TDS − retention − other deductions (GST is already included in gross). An approved claim is immutable; pending and fully/part-paid indicators derive from active posted distribution rows. Payment drafts retain proposed distribution/allocation rows in their encrypted payload. Only posting inserts effective rows, all inside `BEGIN IMMEDIATE` with status, ID, audit, exact totals, capacity and current master checks. Optimistic revisions prevent stale edits; concurrent posting rechecks balances under the write lock. Labour batches use the same payment record with multiple labour claim distributions.

Posted payments stay immutable. A unique reversal record overlays an effective Reversed/Failed state, releases allocations/claim payments, and adds the opposite signed bank movement without deleting the original. The combined bank book includes original receipt credits, original payment debits and signed reversal entries, sorted by effective date and append-only audit sequence (timestamps may tie). Receipt reversal requires no live allocations. All negative bank movements are checked against every resulting running balance. Funding/claim reuse and receipt reversals must not precede the latest linked refund date.

Evidence is local encrypted SQLite content with the same bounded PDF/PNG/JPEG attachment-download controls as receipts. No new runtime dependencies, authentication or remote services were introduced. Reversal evidence references are explicit local annotations, not remotely verified bank confirmations. Tables are append-only where financial history must be retained; corrections are new linked records.

### Phase 3 verification

Domain/store tests cover amounts, dates, relationships, duplicate controls, IDs, history, encryption, revision conflicts and persistence after restart. HTTP tests cover login-free access and cross-site/Host rejection. Browser tests create a complete master chain with external network requests blocked, verify fragment links preserve form input, and inspect desktop/mobile/landscape accessibility and overflow.

## Phase 4 reconciliation and tax

Schema 4 adds encrypted statement imports/lines, reconciliation links/exceptions, immutable other bank movements, period locks, effective tax treatments, tax records/events/evidence. Matching, capacity checks, lock/reopen and tax events execute under `BEGIN IMMEDIATE`. Voided matches and reopened lock records remain present with audit history. Existing posting/reversal entry points check period locks before mutation; bank opening fields also lock once statement or adjustment history exists.

The bank book assigns stable movement keys to receipts, payments, reversals and adjustments. Matching totals belong to those keys, independently of receipt allocations. Reconciliation never changes cash. Bank charges affect only bank cash; tax records affect neither cash nor receipt funding. Tax events use insertion order even when timestamps tie.

## Phase 5 reports and search

`src/reports.mjs` builds read-transaction snapshots from existing registers and the combined bank book. One category aggregation helper drives consolidated and project breakdowns. Cash includes original and reversal movements on their individual business dates; current receipt, claim and tax positions are labelled separately. No schema migration is required.

Report/search/trace GET routes expose source-linked views. A same-origin POST prepares exports and writes an audit entry. `public/reports.js` owns URL filters, 25-row screen pagination, source links, one SVG comparison and local exports. XLSX reuses the bundled SheetJS asset, writes text without formula properties and uses explicit calendar-day serials to avoid timezone shifts. Native browser print/save-to-PDF uses a separate complete report DOM with paged CSS; wide tables become labelled records. No browser automation or npm dependency is required by the application at runtime.

All filtered rows are exported; structured personal fields are omitted and bank account numbers remain masked. Report definitions and current-versus-period semantics are included in each export. Large-volume queries currently reuse existing in-memory register readers; Phase 6 profiling determines whether storage-level pagination/indexing is needed.

`public/reconciliation.js` shares the existing UI helpers. A local worker runs vendored SheetJS 0.20.3 with a 15-second timeout, 2 MB file limit and bounded row reading. Files, worksheet selection and mapped rows are reviewed before import. The source file is encrypted and retained with its SHA-256 hash; no supplied filename becomes a filesystem path. Statement JSON bodies allow 5 MB and tax-evidence bodies 3 MB; ordinary writes retain 64 KB limits. Downloads remain attachments with nosniff and sandbox CSP. No remote assets, formula execution or login are introduced.
