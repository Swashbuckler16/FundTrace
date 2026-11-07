# Offline Phase 1 architecture

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

The master schema uses `user_version=1`. Future phases add forward-only migrations and preserve existing data. Receipts, allocations, bank movement, reversals and tax tables are added in their respective phases, with transaction-safe calculation rather than trusting the UI.

## Verification

Domain/store tests cover amounts, dates, relationships, duplicate controls, IDs, history, encryption, revision conflicts and persistence after restart. HTTP tests cover login-free access and cross-site/Host rejection. Browser tests create a complete master chain with external network requests blocked, verify fragment links preserve form input, and inspect desktop/mobile/landscape accessibility and overflow.
