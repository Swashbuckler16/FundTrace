# FundTrace

A completely offline Labour Society workspace for tracing Government receipts to beneficiary payments. **Phases 1 and 2 implement masters and Government receipts:** draft entry, evidence, confirmed posting, immutable Payment IDs and the bank book. The application opens directly, with no login, passwords, accounts or cloud services.

## Start on this computer

Requires Node.js **24.14+** and a browser (tested with Node 26.13 and Microsoft Edge). No npm installation or internet access is needed to run the application: it has **zero runtime package dependencies**.

Double-click `Start FundTrace.cmd`, or run:

```powershell
node src/server.mjs
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Keep the terminal open while using FundTrace; press Ctrl+C to stop. This address is the local computer, not a website on the internet. Disconnecting Wi-Fi or internet does not affect local operation. Start the app again whenever you restart the computer.

Create your Society, department, bank account, project and beneficiaries. Records persist between restarts. No sample financial records are installed. The final Phase 6 distribution will bundle the runtime for offline installation; this development phase uses an installed Node runtime.

## Local data

SQLite records and the encryption key are stored in `data/`, which is ignored by Git. For real records, use a private directory outside OneDrive or other cloud-sync folders:

```powershell
$env:FUNDTRACE_DATA_DIR = 'C:/private/fundtrace'
node src/server.mjs
```

Master payloads and before/after snapshots use AES-256-GCM encryption. Names, public IDs and other indexing fields are readable in SQLite. Bank numbers and contact/tax details are masked in general views; **Reveal masked details** displays them and records the action. Anyone who can use this computer can use the app: masking is privacy presentation, not user authorization. The local key does not protect against someone who can read both the key and database.

Keep the database and encryption key together in a private backup. Losing the original key makes encrypted records unreadable. Automated local backup/restore tooling and an offline recovery exercise are Phase 6 requirements. Audit entries say **Local workspace** and do not claim to identify a person.

| Variable             | Default             | Purpose                                         |
| -------------------- | ------------------- | ----------------------------------------------- |
| `FUNDTRACE_DATA_DIR` | `./data`            | Local persistent database/key directory         |
| `FUNDTRACE_KEY`      | generated local key | Optional 64-character hex key, supplied locally |
| `PORT`               | `3000`              | Local HTTP port                                 |

The server always binds to `127.0.0.1`. It checks Host and Origin, rejects cross-site requests, requires a custom header for writes and does not enable CORS. No external APIs, fonts, assets, analytics, telemetry, license checks or remote authentication are used. All application assets are local.

## Development verification

Only development tooling needs a one-time package download; it is not needed to launch or use FundTrace.

```powershell
npm ci
npm test
npm run check
npm run test:ui
```

UI tests use Edge on Windows or Playwright Chromium elsewhere (`npx playwright install chromium` for development). They block every external browser request, exercise the actual local database/API and save isolated Example/Test screenshots to ignored `artifacts/`. They do not disconnect the computer's internet connection. CI and CodeRabbit are development services, not application dependencies.

## Delivery

See the [six-phase roadmap](docs/ROADMAP.md), [architecture](docs/ARCHITECTURE.md), [design](DESIGN.md), and [Phase 2 verification](docs/PHASE2-VERIFICATION.md). Payments and allocation begin in Phase 3, after the owner's review.

## Record a receipt

Open **Government receipts → Record receipt**. Select the Society, department, project and receiving bank; enter the actual credited amount, credit/value dates and payment reference. You can save incomplete records as drafts; drafts create no cash or Payment ID.

Attach local PDF, PNG or JPEG bank evidence (maximum five files, 2 MB each). Review the receipt and confirm the bank credit to post it. All project/bank mappings, dates, positive amount and evidence must be complete. Electronic transfers require a reference, cheques require a cheque number, and Other requires narration. Possible duplicates require explicit confirmation and a documented reason.

Posting assigns `LSP-SOCIETY-FY-SEQUENCE` using the **credit date's** Indian financial year and adds only the credited amount to the bank book. Gross bill, GST deductions and tax credits are informational, never cash. Evidence is encrypted in the same local database. Posted receipts and evidence are locked; reversal controls arrive in Phase 3. Bank opening balance/date/account number cannot change once credits have posted. Bank balances currently include opening balances and receipt credits only; they are not reconciled statement balances.
