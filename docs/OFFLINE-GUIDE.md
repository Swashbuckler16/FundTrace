# FundTrace offline Windows release

## First start

1. Extract the entire FundTrace ZIP to a private, writable local folder, for example `C:\FundTrace`. Do not run inside the ZIP, Program Files, a network share or a cloud-synced folder.
2. Double-click **Start FundTrace.cmd**. The portable package includes Node 24 LTS; no Node/npm installation, account or internet is needed. Use an installed modern Microsoft Edge or Chrome browser. Windows 11 x64 is the tested release target; other Windows versions and ARM are not certified.
3. Open **http://127.0.0.1:3000**. Keep the launcher window open. Press **Ctrl+C** there to stop safely; closing only the browser does not stop the application.
4. Set up Society, department, project, bank opening balance and beneficiaries. Record receipts with proof, then claims and payments. Enter real amounts only after reviewing the opening date/balance: transaction history makes them immutable.

The address refers only to this computer. All fonts, scripts, Excel processing and storage are local. GitHub and CodeRabbit are development tools and are never contacted by the application. There is no login or claimed independent approval authority: local confirmations and reviewer names are audit annotations.

## Language / भाषा

Open **Settings → Language** and choose **English / मराठी / हिन्दी**, then **Save language**.

मराठी: **सेटिंग्ज → भाषा → मराठी → भाषा जतन करा**. इंटरनेट लागत नाही. तुमच्या नोंदी आणि रक्कम बदलत नाहीत.

हिन्दी: **सेटिंग → भाषा → हिन्दी → भाषा सेव करें**। इंटरनेट नहीं चाहिए। आपके रिकॉर्ड और रकम नहीं बदलते।

The language choice belongs to the browser and local address. Use the same browser and port each time. Clearing browser storage resets it to English. The app bundles all translations; Windows supplies the Devanagari fonts. Browser-owned date pickers, file dialogs and print dialogs use your browser/Windows language. Entered names, references, raw audit snapshots and existing Excel export formats are preserved.

For an upgrade, create a verified backup, close the old app, extract version 2 to a separate folder, then use **Restore FundTrace.cmd** with the backup as described below (or point `FUNDTRACE_DATA_DIR` at your existing private data folder). Do not run both versions against the same workspace. Version 2 requires no financial database migration.

## Data and backup locations

By default, the application's `data` folder holds the database and encryption key. Attachments are in the database. `data-backups` beside it holds completed backups; a `.pending-…` folder is an incomplete backup and must not be restored. The Backup & recovery page displays the actual absolute paths and completed dates.

Advanced deployments can set `FUNDTRACE_DATA_DIR` to a dedicated private folder before launch. The server does not load `.env` files. Use the same environment for launch and recovery. `PORT` changes the loopback port if 3000 is occupied. Do not change the encryption key of an existing workspace. Recovery refuses an environment key override: clear `FUNDTRACE_KEY` so the restored key is used.

Only one FundTrace process may use a data folder. Multiple browser tabs share that process and transactions still recheck revisions, funding and claims atomically. After a power cut, **Unlock FundTrace.cmd** removes a stale lock only if its recorded process no longer exists. If that PID has been reused, restart Windows and try again; do not delete a live lock. Raw database tools are outside this lifecycle guard and must not access the workspace during restore.

## Back up and restore

Open **Backup & recovery**, acknowledge the privacy notice and choose **Create verified backup**. Completion means a consistent SQLite snapshot, checksums, database integrity, foreign keys and every encrypted record/attachment/audit payload have been verified. Copy the entire named backup folder to an external drive. It contains `fundtrace.sqlite`, `encryption.key` and `manifest.json`.

An automatic backup is made at startup if no completed copy is less than 24 hours old. An hourly check repeats this while the app is open. That means up to approximately **25 hours of work** may be absent from an automatic copy; create a manual copy at the end of each work session and before upgrades or major corrections. No backup job runs while FundTrace is closed. A failure is printed in the launcher and shown on the recovery page; correct free space/permissions and retry.

Backups are **never automatically deleted**. Review disk space monthly. Keep at least two verified copies on separate drives; local backups alone do not protect against drive loss, theft or ransomware. Database field encryption is not full-disk encryption, and the backup includes its usable key. Protect the application, backup and exported report folders with Windows access controls and disk encryption. Checksums detect accidental damage, not a maliciously replaced backup; restore only trusted copies. No cloud upload is built in.

To restore:

1. Stop FundTrace with Ctrl+C. Copy the backup to a local folder outside the active data folder.
2. Double-click **Restore FundTrace.cmd**. Paste the full backup folder path (surrounding quotes are accepted).
3. Review the verified backup timestamp and destination. Type **RESTORE** exactly. Any other answer cancels without replacing data.
4. The tool verifies a staged copy before replacing the active folder. The previous folder is retained as `data-before-restore-…` beside it, including its original key and WAL. No automatic merge is performed. The restored audit history receives a recovery event.
5. Start FundTrace and inspect recent Payment IDs, bank balances, attachments and exports. Records created after the backup are absent. Keep the previous folder until you accept the result.

If power fails during the two directory renames, the data folder may be absent while the `data-before-restore-…` and `.data-restore-…` folders remain. A recovery marker blocks startup from silently creating an empty workspace. Preserve all folders, unlock the stopped process if needed, and run Restore FundTrace.cmd with the original trusted backup again. Successful recovery clears the marker. Never combine databases and keys from different workspaces.

For a read-only backup check in a terminal, run `runtime\node.exe scripts\recovery.mjs verify "C:\path\to\backup-folder"`. A source checkout can use `node` instead. Normal recovery needs no developer tools or network.

## Upgrade and troubleshoot

Make an external verified backup first. Extract a new release into a separate folder. Stop the old app and use the new release's restore tool to restore that backup into its new data folder. Verify balances before retiring the old release. Never overwrite an active data folder or copy a live SQLite file alone. A future database schema is rejected by older builds rather than silently downgraded.

If startup says the port is occupied, stop the other FundTrace window or use a different `PORT`; do not assume the browser belongs to the newly launched workspace. If there is no connection, check the launcher for errors and the displayed port. Disk-full and inaccessible-folder failures must be corrected before continuing. Keep at least enough free space for an additional full database snapshot; restore also needs a staged database plus the preserved previous directory. Recovery time depends on database size and storage speed; no guaranteed recovery-time SLA is claimed.

Print/PDF: choose Print / Save PDF in a report, then the browser's local Save as PDF destination. Excel exports are generated locally. The package has no auto-updater, online bank feed, payment initiation or statutory return submission.

## Final owner acceptance (required before live adoption)

Use a disposable workspace with Wi-Fi disconnected and Ethernet unplugged. Open the portable app without Node on PATH. Create a Society/project/bank/beneficiary, post a receipt with attachment, approve a claim and fund/post its payment. Check bank cash and receipt utilisation; enter a statement, match it and close/reopen a reconciled period. Record tax credit and verify it does not increase cash. Search a Payment ID, inspect its trace, export XLSX and save a PDF. Restart and check persistence. Create an external backup, add a disposable record, restore the backup and verify the new record is absent while attachments and balances agree.

Record the release ZIP checksum, Windows/browser versions, reviewer, date, data volume, result and any defects. Automated tests and browser external-request blocking do not substitute for this physical-network-disconnection test or your acceptance of the accounting workflow. The developer cannot sign owner acceptance on your behalf.
