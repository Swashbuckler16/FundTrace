import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createApp } from "../src/server.mjs";
import { backupRoot } from "../src/recovery.mjs";
import { reportFixture } from "../test/support/report-fixture.mjs";
const f = reportFixture(),
  server = createApp(f.store);
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(
  process.platform === "win32" ? { channel: "msedge" } : {},
);
const results = [],
  external = [],
  errors = [];
mkdirSync("artifacts", { recursive: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await context.route("**/*", async (route) => {
    if (new URL(route.request().url()).origin !== origin) {
      external.push(route.request().url());
      await route.abort();
    } else await route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  const check = async (name) => {
    assert.deepEqual(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations.map((v) => v.id),
      [],
    );
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      name,
    );
    await page.screenshot({ path: `artifacts/${name}.png`, fullPage: true });
    results.push(name);
  };
  await page.goto(`${origin}/?page=recovery`);
  await page
    .getByRole("heading", { name: "Create your first backup" })
    .waitFor();
  await check("phase6-recovery-empty-desktop");
  await page.getByRole("button", { name: "Create verified backup" }).click();
  await page.locator("#backup-form .error:not(:empty)").waitFor();
  assert.equal(
    await page
      .locator("#backup-form .error")
      .evaluate((e) => e === document.activeElement),
    true,
  );
  await check("phase6-recovery-validation");
  const errorLink = page.locator(
    '#backup-form .error a[href="#backup-confirm"]',
  );
  assert.match(await errorLink.innerText(), /private records/);
  await errorLink.click();
  assert.equal(
    await page
      .locator("#backup-confirm")
      .evaluate((e) => e === document.activeElement),
    true,
  );
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create verified backup" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Backup verified and saved" })
    .waitFor();
  await check("phase6-recovery-saved-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await check("phase6-recovery-mobile");
  await page.setViewportSize({ width: 844, height: 390 });
  await check("phase6-recovery-landscape");
  await page.reload();
  await page.getByRole("heading", { name: "Latest local backup" }).waitFor();
  assert.equal(await page.locator("tbody tr").count(), 1);
  assert.deepEqual(external, []);
  assert.deepEqual(errors, []);
  writeFileSync(
    "artifacts/phase6-ui-results.json",
    JSON.stringify({ results, external, errors }, null, 2),
  );
  console.log(
    `${results.length} phase 6 UI checkpoints passed; no axe violations, overflow or external requests.`,
  );
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
  f.close();
  const path = backupRoot(f.directory);
  assert.equal(dirname(resolve(path)), resolve(tmpdir()));
  rmSync(path, { recursive: true, force: true });
}
