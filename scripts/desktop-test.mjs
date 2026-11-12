import { _electron as electron } from "playwright";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  existsSync,
  readFileSync,
  rmSync,
  mkdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { reportFixture } from "../test/support/report-fixture.mjs";

const fixture = reportFixture();
fixture.store.close();
const temporary = mkdtempSync(join(tmpdir(), "fundtrace-desktop-"));
const profile = join(temporary, "profile");
const probe = createServer();
await new Promise((done) => probe.listen(0, "127.0.0.1", done));
const port = probe.address().port;
await new Promise((done) => probe.close(done));
const executablePath = resolve(
  process.argv[2] || "node_modules/electron/dist/electron.exe",
);
const args = process.argv[2] ? [] : ["."];
const env = {
  ...process.env,
  PATH: "",
  FUNDTRACE_DESKTOP_PROFILE: profile,
  FUNDTRACE_DATA_DIR: fixture.directory,
  FUNDTRACE_DESKTOP_PORT: String(port),
};
delete env.ELECTRON_RUN_AS_NODE;
let application;
const start = async () => {
  application = await electron.launch({
    executablePath,
    args,
    env,
    timeout: 45000,
  });
  const page = await application.firstWindow();
  await page.locator(".sidebar nav a").first().waitFor();
  await page.locator("#main h1").waitFor();
  return page;
};
const stop = async () => {
  if (!application) return;
  const closing = application.waitForEvent("close");
  await application.evaluate(({ app }) => {
    setTimeout(() => app.quit(), 30);
  });
  await closing;
  application = null;
  assert(
    !existsSync(`${fixture.directory}.lock`),
    "Clean exit releases workspace lock",
  );
};
try {
  let page = await start();
  const prefs = await application.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences(),
  );
  assert.equal(prefs.nodeIntegration, false);
  assert.equal(prefs.contextIsolation, true);
  assert.equal(prefs.sandbox, true);
  assert.equal(await page.evaluate(() => typeof window.require), "undefined");
  const duplicate = spawn(executablePath, args, {
    env,
    windowsHide: true,
    stdio: "ignore",
  });
  assert.equal((await once(duplicate, "exit"))[0], 0);
  assert.equal(application.windows().length, 1);
  assert.equal(
    await page.evaluate(async () => {
      try {
        await fetch("https://example.com");
        return false;
      } catch {
        return true;
      }
    }),
    true,
  );
  const origin = new URL(page.url()).origin;
  await page.goto(`${origin}/?page=recovery`);
  await page
    .getByText("Use the FundTrace menu at the top of this window", {
      exact: false,
    })
    .waitFor();
  assert(
    !(await page.locator("#main").innerText()).includes(
      "Restore FundTrace.cmd",
    ),
  );
  const backup = await page.evaluate(
    async () => (await (await fetch("/api/recovery")).json()).backups[0].path,
  );
  await page.goto(`${origin}/?page=settings`);
  await page.locator("#language").selectOption("mr");
  await Promise.all([
    page.waitForNavigation(),
    page.locator("#language-form button").click(),
  ]);
  assert.equal(await page.locator("html").getAttribute("lang"), "mr");
  await page.goto(`${origin}/?page=departments&new=1`);
  await page.locator("#f-name").fill("Desktop टिकून राहिलेले नाव");
  await page.locator("#master-form button[type=submit]").click();
  await page.locator("#detail-fields").waitFor();
  mkdirSync("artifacts", { recursive: true });
  await page.screenshot({ path: "artifacts/desktop-marathi.png" });
  await stop();
  page = await start();
  assert.equal(await page.locator("html").getAttribute("lang"), "mr");
  await page.goto(`${origin}/?page=departments`);
  await page.getByText("Desktop टिकून राहिलेले नाव", { exact: true }).waitFor();
  // Exercise the actual native menu callback, replacing only human dialog responses.
  await application.evaluate(({ dialog, app }, source) => {
    dialog.showOpenDialog = async () => ({
      canceled: false,
      filePaths: [source],
    });
    dialog.showMessageBox = async () => ({ response: 1 });
    dialog.showErrorBox = (_title, message) => {
      throw new Error(message);
    };
    app.relaunch = () => {}; // The test owns the next launch.
  }, backup);
  const closed = application.waitForEvent("close");
  await application.evaluate(({ Menu }) =>
    Menu.getApplicationMenu().items[0].submenu.items[2].click(),
  );
  await closed;
  application = null;
  page = await start();
  await page.goto(`${origin}/?page=departments`);
  await page.locator("#main h1").waitFor();
  assert(
    !(await page.locator("#main").innerText()).includes(
      "Desktop टिकून राहिलेले नाव",
    ),
  );
  await page.goto(`${origin}/?page=settings`);
  await page.locator("#language").selectOption("en");
  await Promise.all([
    page.waitForNavigation(),
    page.locator("#language-form button").click(),
  ]);
  const downloadPath = join(temporary, "export.xlsx");
  await application.evaluate(
    ({ session }, path) =>
      session.defaultSession.on("will-download", (_event, item) =>
        item.setSavePath(path),
      ),
    downloadPath,
  );
  await page.goto(`${origin}/?page=reports&type=receipts&period=all`);
  await page.locator("#export-xlsx").click();
  await page.waitForFunction(() =>
    document
      .querySelector("#export-status")
      ?.textContent.includes("prepared locally"),
  );
  for (let i = 0; i < 100 && !existsSync(downloadPath); i++)
    await new Promise((done) => setTimeout(done, 100));
  assert(readFileSync(downloadPath).length > 1000);
  const pdfPath = join(temporary, "report.pdf");
  await application.evaluate(({ dialog }, path) => {
    dialog.showSaveDialog = async () => ({ canceled: false, filePath: path });
  }, pdfPath);
  await page.locator("#export-print").click();
  await page.getByText("PDF saved locally.", { exact: true }).waitFor();
  assert.equal(readFileSync(pdfPath).subarray(0, 5).toString(), "%PDF-");
  await application.evaluate(({ dialog }) => {
    dialog.showSaveDialog = async () => ({ canceled: true });
  });
  await page.locator("#export-print").click();
  await page.getByText("PDF save cancelled.", { exact: true }).waitFor();
  await stop();
  console.log(
    "Desktop passed: offline native window, isolation, single instance, Marathi persistence, saved Unicode data, native restore, Excel download, PDF and clean shutdown; no Node on PATH.",
  );
} finally {
  await application?.close();
  for (const directory of [
    temporary,
    fixture.directory,
    `${fixture.directory}-backups`,
  ]) {
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    rmSync(directory, { recursive: true, force: true });
  }
}
