# FundTrace

A completely offline Labour Society workspace for tracing Government receipts to beneficiary payments. **Includes receipts, payments, reconciliation, tax records, search, reports, verified backups and offline recovery.** The application opens directly, with no login, passwords, accounts or cloud services.

## How to install (Windows offline package)

1. Open [FundTrace releases](https://github.com/Swashbuckler16/FundTrace/releases) and download the **FundTrace-v2.0.0-win-x64-….zip** asset. Choose the portable ZIP, not GitHub's **Source code** archive. You can download it on another computer and copy it using a USB drive.
2. Right-click the ZIP and choose **Extract All**. Keep the complete `FundTrace` folder in a private, writable local location such as `C:\FundTrace`. Do not run the app from inside the ZIP or a cloud-synced folder.
3. Open that folder and double-click **Start FundTrace.cmd**. The package includes its own Node runtime, so you do **not** need to install Node.js, npm or any packages. Use Windows 11 x64 with an installed Microsoft Edge or Chrome browser.
4. Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser. Keep the launcher window open while working. No internet connection, login or account is needed.
5. Open **Settings → Language**, select **English / मराठी / हिन्दी**, and click **Save language**. Set up your Society and other master records before entering transactions.
6. To close the app, press **Ctrl+C** in the launcher. To use it again, double-click **Start FundTrace.cmd**. Your saved records remain in the local data folder.

**Upgrading from version 1:** Create a verified backup in **Backup & recovery**, close the old application, and extract version 2 into a separate folder. Run **Restore FundTrace.cmd** from version 2 and follow the [backup restoration instructions](docs/OFFLINE-GUIDE.md#back-up-and-restore). If you already use a separate `FUNDTRACE_DATA_DIR`, keep pointing to that same directory instead. Do not run both versions together against the same records, and retain your old folder and backup until you have checked the upgrade.

**If it does not open:** Confirm the entire ZIP was extracted, the launcher is still running, and the browser address is exactly `http://127.0.0.1:3000`. Read any error in the launcher; the [offline guide](docs/OFFLINE-GUIDE.md) explains data locations, stale locks and recovery.

## Run from source (developers)

**Version 2.0.0:** Open **Settings → Language**, choose **English**, **मराठी** or **हिन्दी**, then save. Marathi and Hindi use simple Devanagari wording. Translations are bundled locally and work offline. The choice is saved in this browser; names, entered notes, IDs, amounts and financial rules stay unchanged. Existing Excel export formats and raw audit evidence remain unchanged.

Requires Node.js **24.14+** and a browser (tested with Node 26.13 and Microsoft Edge). No npm installation or internet access is needed to run the application: it has **zero runtime package dependencies**.

Double-click `Start FundTrace.cmd`, or run:

```powershell
node src/server.mjs
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Keep the terminal open while using FundTrace; press Ctrl+C to stop. This address is the local computer, not a website on the internet. Disconnecting Wi-Fi or internet does not affect local operation. Start the app again whenever you restart the computer.

Create your Society, department, bank account, project and beneficiaries. Records persist between restarts. No sample financial records are installed. The Phase 6 Windows x64 portable distribution bundles Node 24.20.0. See [Offline setup and recovery](docs/OFFLINE-GUIDE.md).

## Local data

SQLite records and the encryption key are stored in `data/`, which is ignored by Git. For real records, use a private directory outside OneDrive or other cloud-sync folders:

```powershell
$env:FUNDTRACE_DATA_DIR = 'C:/private/fundtrace'
node src/server.mjs
```

Master payloads and before/after snapshots use AES-256-GCM encryption. Names, public IDs and other indexing fields are readable in SQLite. Bank numbers and contact/tax details are masked in general views; **Reveal masked details** displays them and records the action. Anyone who can use this computer can use the app: masking is privacy presentation, not user authorization. The local key does not protect against someone who can read both the key and database.

Keep the database and encryption key together in a private backup. Losing the original key makes encrypted records unreadable. Use Backup & recovery for verified manual and daily automatic backups; the restore launcher retains the previous workspace. Audit entries say **Local workspace** and do not claim to identify a person.

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

See the [six-phase roadmap](docs/ROADMAP.md), [architecture](docs/ARCHITECTURE.md), [design](DESIGN.md), and [Phase 5 verification](docs/PHASE5-VERIFICATION.md). See [Phase 6 release verification](docs/PHASE6-VERIFICATION.md) and the owner acceptance checklist in the offline guide.

## Record a receipt

Open **Government receipts → Record receipt**. Select the Society, department, project and receiving bank; enter the actual credited amount, credit/value dates and payment reference. You can save incomplete records as drafts; drafts create no cash or Payment ID.

Attach local PDF, PNG or JPEG bank evidence (maximum five files, 2 MB each). Review the receipt and confirm the bank credit to post it. All project/bank mappings, dates, positive amount and evidence must be complete. Electronic transfers require a reference, cheques require a cheque number, and Other requires narration. Possible duplicates require explicit confirmation and a documented reason.

Posting assigns `LSP-SOCIETY-FY-SEQUENCE` using the **credit date's** Indian financial year and adds only the credited amount to the bank book. Gross bill, GST deductions and tax credits are informational, never cash. Evidence is encrypted in the same local database. Posted receipts and evidence are locked. Bank opening balance/date/account number cannot change once credits have posted. Bank balances include opening balances, receipt credits, payment debits and reversals; use Bank reconciliation to match them to statement evidence.

## Claims, payments and corrections

1. Open **Claims & instalments → New claim**. Choose the Society, project and beneficiary. Enter the invoice/work/wage reference and category-specific details. Net payable is gross (including GST) minus TDS, retention and other deductions. GST is informational and not added twice. Save, review and approve the claim locally. Approved financial terms are locked.
2. Open **Outward payments → New payment**. Choose the same Society/project and paying bank, enter actual debit/value dates and the bank reference. Add a claim amount for each instalment and allocate the full debit to one or more posted receipt IDs. Each payment gets its own `OUT-FY-SEQUENCE` when posted.
3. For a labour batch, check **Labour batch**, add the individual approved labour claims and each beneficiary amount, and allocate their combined total to receipts. The distribution schedule creates **one bank debit**, never one debit per row plus a second batch debit.
4. Save the draft, attach supporting evidence, then **Submit for review → Approve payment → Post confirmed bank debit**, confirming each action. These are local recorded decisions, not different authenticated users. FundTrace records money already paid; it does not initiate a transfer.
5. Use **Return to draft** to correct a submitted/approved record. Cancel or mark an unposted failed instruction with a reason; neither affects balances. For a posted payment that has been returned or failed to settle, confirm a reversal with its date, bank evidence reference and reason. This restores bank cash, receipt availability and claim pending once, retaining the original. **Create corrected payment** links the replacement to its original and requires new evidence and confirmation.

Funding is restricted to posted receipts in the **same Society, project and bank account**, with no unfunded residual. Draft/submitted/approved payments do not reserve funds. Posting atomically rechecks receipt and claim capacity, exact allocation/distribution totals, duplicate bank references and bank-book balances. Same-amount/date debits require an explicit duplicate override reason; a reused bank reference/cheque is blocked.

A receipt can be reversed only after all its linked payments are reversed. Movements cannot precede their source credit, and released funding cannot be used before the latest linked reversal date. Backdated movements that would make a historical or later bank-book balance negative are rejected. Cash mode must represent an evidenced bank-funded debit/withdrawal; this is not a separate petty-cash ledger. Tax deductions are recorded on claims; separate tax treatment and credit registers are available without statutory filing automation.

## Reconcile a bank period

Open **Bank reconciliation → Import statement**. Choose a bank, statement dates and opening/closing balances. Select a local CSV/Excel file or enter CSV rows, read it, select the worksheet and map columns. Use separate Debit and Credit columns (unused values may be blank), a header and ascending dates. Preview, review and confirm the import. The limit is 2 MB and 2,000 rows; split larger statements into consecutive periods with carried balances.

Review each statement line and link one or more posted bank-book movements. Partial matches are supported; different dates/references need a reason. Record missing bank fees/interest under **Other bank movements**. These movements do not create receipt funds. Track unresolved differences with an owner annotation, reason and exception status.

Under **Reconciled periods**, lock only when every statement/book movement is matched, exceptions resolved and statement balances agree. Locks protect earlier balances too. Reopening needs a documented reason and local confirmation, latest locked period first. Removed matches and corrections retain history.

## Track tax separately

First configure **Tax treatments** using actual accountant-confirmed rates, basis, evidence reference and effective date. No rate is assumed. Under **Tax register**, add a record linked to its Society/project and optionally its actual receipt, attach certificate/ledger evidence and review the expected calculation. An override needs a reason. Append credits, set-offs, disputes or adjustments with evidence; set-offs cannot exceed available credit. Tax credits and bank annotations never create bank cash or receipt funding.

## Dashboard, search and reports

Open **Financial dashboard** for period cash and current receipt/tax positions. Choose an Indian financial year (April–March), month, custom period or all dates. Cash uses bank movement dates; reversals appear on their own dates. Current positions are labelled separately.

Use **Search & Payment ID 360** for exact Payment IDs or partial names/references, with scope, status and amount filters. Open a receipt result for its linked payments, evidence, allocations, tax, reconciliation and chronological activity. Posted receipt details also link directly to Payment ID 360.

Under **Reports & exports**, select a report and apply its relevant filters. Totals cover all matching rows; the screen shows 25 at a time. **Export Excel (.xlsx)** creates a local workbook with report definitions and numeric amounts. **Print / save PDF** opens the browser print dialog: choose the offline **Save as PDF** destination or your printer. Reports include page numbers, period, filters, generation time and totals; bank accounts remain masked. No online conversion service is used.

See [Phase 5 verification](docs/PHASE5-VERIFICATION.md) for exact date, reversal, current-balance and export rules. See the offline guide for portable distribution, backup/restore, and final owner acceptance.
