export async function renderRecovery(main, { api, esc, head, when, bindForm }) {
  const data = await api("/recovery");
  main.innerHTML =
    head(
      "Backup & recovery",
      "Keep a verified copy before closing your books.",
    ) +
    `
    ${data.automaticError ? `<p class="error" role="alert">${esc(data.automaticError)}</p>` : ""}
    <section class="onboarding"><h2>${data.backups.length ? "Latest local backup" : "Create your first backup"}</h2>
    <p>${data.backups.length ? esc(when(data.backups[0].createdAt)) : "No completed backup is recorded in this workspace’s backup folder."}</p>
    <p>Automatic backups run when FundTrace starts and once a day while it is open. Keep a separate copy on an external drive to protect against computer loss.</p>
    <form id="backup-form" novalidate><div class="error" role="alert" tabindex="-1"></div>
    <div class="check"><input id="backup-confirm" type="checkbox" name="confirm" required><label for="backup-confirm">I understand that backup folders include private records and their encryption key.</label></div>
    <button class="primary" type="submit">Create verified backup</button></form>
    <p id="backup-result" role="status"></p></section>
    <section class="onboarding"><h2>Where your records are stored</h2>
    <dl class="details"><div><dt>Active workspace</dt><dd>${esc(data.directory)}</dd></div><div><dt>Local backup folder</dt><dd>${esc(data.backupDirectory)}</dd></div></dl>
    <p>Copy one dated backup folder, including all three files. Checksums detect damage; they do not prove who created a backup. Use only your trusted backups.</p>
    <p>Backups are retained until you remove them. Review disk space monthly and keep at least two verified copies on separate drives.</p></section>
    <section class="onboarding"><h2>Restore a saved workspace</h2>
    <ol><li>Close FundTrace with Ctrl+C in its launcher window.</li><li>Open <strong>Restore FundTrace.cmd</strong> in the application folder.</li><li>Paste the dated backup folder path. Review its date and the destination, then type RESTORE.</li><li>Start FundTrace and check recent records, balances and attachments.</li></ol>
    <p>Restore validates the database and key before replacing anything. Your previous data folder is retained beside the active workspace. Changes made after the backup will not appear in the restored workspace.</p>
    <details><summary>After a power cut or unexpected shutdown</summary><p>If the workspace stays locked after its process has stopped, open <strong>Unlock FundTrace.cmd</strong>, then start again. The tool refuses to unlock a running process.</p></details></section>
    <section class="recovery-list"><h2>Saved local backups</h2>${data.backups.length ? `<div class="table-wrap"><table><thead><tr><th>Created (IST)</th><th>Folder</th><th>Database size</th></tr></thead><tbody>${data.backups.map((b) => `<tr><td>${esc(when(b.createdAt))}</td><td data-label="Folder">${esc(b.path)}</td><td data-label="Database size">${(b.bytes / 1024 / 1024).toFixed(2)} MB</td></tr>`).join("")}</tbody></table></div>` : `<p>No backups yet.</p>`}</section>`;
  bindForm("backup-form", async () => {
    const result = await api("/backups", {
      method: "POST",
      body: { confirm: true },
    });
    await renderRecovery(main, { api, esc, head, when, bindForm });
    const notice = main.querySelector("#backup-result");
    notice.textContent = `Backup verified and saved: ${result.path}. Copy this entire folder to your external drive.`;
    notice.tabIndex = -1;
    notice.focus();
  });
}
