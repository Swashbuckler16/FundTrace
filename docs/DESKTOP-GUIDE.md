# FundTrace desktop 2.1

> **📘 Customer Guide:** For a complete, non-technical walkthrough of every screen and workflow, see the **[Complete Customer User Manual](USER-MANUAL.md)**.

## Install and open

Download `FundTrace-Setup-2.1.0.exe` from the repository release. Run it and follow the installer. Open FundTrace from its desktop or Start-menu shortcut. Everything needed to run the app is included. No terminal, external browser, Node installation, account or internet connection is needed after downloading the installer. Close the window to stop the local workspace safely.

The installer is currently unsigned. Windows can show an unknown-publisher warning. The release includes a SHA-256 checksum for checking the downloaded file.

## Language / भाषा

Choose **Settings → Language → English / मराठी / हिन्दी**, then save.

मराठी: **सेटिंग्ज → भाषा → मराठी → भाषा जतन करा**. तुमच्या नोंदी आणि रक्कम बदलत नाहीत.

हिन्दी: **सेटिंग → भाषा → हिन्दी → भाषा सेव करें**। आपके रिकॉर्ड और रकम नहीं बदलते।

The app remembers the selected language. The FundTrace, Edit and View menus follow it. Windows-owned file dialogs use your Windows language. Entered names, financial values, IDs and raw audit snapshots remain unchanged.

## Records and upgrades

The default data folder is `%APPDATA%\FundTrace\workspace`. Browser display preferences are beside it in the application profile. Data is outside the installation directory, so installing a newer version does not replace it. Uninstalling leaves records intact. **Backup & recovery** displays the actual workspace and backup paths.

To bring records from the previous browser edition, create a verified backup there and close it. In the desktop app, choose **FundTrace → Restore backup**, select the complete dated backup folder and confirm after checking its date and destination. The app restarts automatically. Inspect recent records, balances and evidence before retiring the old copy. Do not manually combine databases and encryption keys.

An existing `FUNDTRACE_DATA_DIR` environment setting is respected. Do not run the browser and desktop editions against the same data folder at once; workspace locking prevents simultaneous access.

## Back up and restore

Use **Backup & recovery → Create verified backup** and copy the entire dated folder to an external drive. Automatic backups also run at startup when due and are checked hourly. Copies on the same drive do not protect against drive failure. Backups include sensitive records and their encryption key; keep them private.

For restoration use **FundTrace → Restore backup** in the top menu. The app verifies the backup, asks for confirmation, stops the local workspace and restores it. The previous workspace is retained beside the active folder. Changes made after the chosen backup will not be present in the restored records. A cancelled or invalid backup selection does not replace the active workspace.

After a crash, restart the app. If a stopped process left a lock, choose **Unlock after a crash** in the startup message. A still-running process cannot be unlocked. If restoration was interrupted, choose **Restore backup** and retry with your original trusted backup; preserve any previous/staging folders until recovery succeeds.

## Exports and printing

**Export Excel** opens a native Save dialog. **Print / save PDF** opens a native PDF Save dialog; no printer or browser PDF destination is required. Both work offline. Existing Excel columns and financial values remain unchanged.

## Troubleshooting

Only one desktop instance opens. Opening the shortcut again focuses the existing window. The app uses a private loopback connection on port 31764 internally; it does not open a browser or contact internet services. If that port is occupied, close the other FundTrace process and retry. Advanced deployments may set `FUNDTRACE_DESKTOP_PORT` to another unused port; this changes the browser-origin language preference, so reselect your language afterward.

Resolve disk-full or folder-permission errors before continuing. Keep enough free space for a backup and staged restore. Recovery details and corruption safeguards are described in the legacy offline guide; use the desktop menu instead of its `.cmd` instructions.

## Developer verification

Run `npm ci`, `node node_modules/electron/install.js`, then `npm run start:desktop`. Build the installer with `npm run build:desktop`. `npm run test:desktop` exercises a disposable workspace, native restoration and exports, language persistence and clean shutdown. Pass an installed `FundTrace.exe` path to `node scripts/desktop-test.mjs` to test the packaged app. The Windows CI job silently installs the generated installer into its disposable runner before testing it.
