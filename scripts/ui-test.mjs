import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { Store } from "../src/store.mjs";
import { createApp } from "../src/server.mjs";

const directory = mkdtempSync(join(tmpdir(), "fundtrace-ui-"));
const store = new Store(directory);
const server = createApp(store);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
mkdirSync("artifacts", { recursive: true });
let browser;
const results = [];
try {
  browser = await chromium.launch(
    process.platform === "win32" ? { channel: "msedge" } : {},
  );
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const check = async (name) => {
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
      `${name}: accessibility violations`,
    );
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `${name}: viewport overflow`,
    );
    await page.screenshot({ path: `artifacts/${name}.png`, fullPage: true });
    results.push({ name, axeViolations: 0, overflow: false });
  };
  const visit = async (path) => {
    await page.goto(`${origin}/${path}`);
    await page.getByRole("heading", { level: 1 }).waitFor();
  };
  const externalRequests = [];
  await context.route("**/*", async (route) => {
    if (new URL(route.request().url()).origin !== origin) {
      externalRequests.push(route.request().url());
      await route.abort();
    } else await route.continue();
  });
  await visit("");
  await page
    .getByRole("heading", { name: "Your records, ready for work." })
    .waitFor();
  assert.equal(await page.locator('input[type="password"]').count(), 0);
  await check("overview-empty");
  await page.getByRole("link", { name: "Add Society", exact: true }).click();
  // Invalid submission preserves the form and focuses a linked error summary.
  await page
    .getByLabel("Society name (required)")
    .fill("Unsaved Society input");
  await page.getByRole("button", { name: "Create record" }).click();
  await page.getByRole("alert").waitFor();
  assert.equal(
    await page
      .locator("[role=alert]")
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page.getByRole("alert").getByRole("link").first().click();
  assert.equal(
    await page.getByLabel("Society name (required)").inputValue(),
    "Unsaved Society input",
  );
  assert.equal(
    await page
      .getByLabel("Society code (required)")
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page
    .getByLabel("Society name (required)")
    .fill("Example Labour Society");
  await page.getByLabel("Society code (required)").fill("EXAMPLE");
  await page.getByLabel("Effective from (required)").fill("2026-04-01");
  await page.getByLabel("Working percentage (%)").fill("5.25");
  await page.getByRole("button", { name: "Create record" }).click();
  await page
    .getByRole("heading", { name: "Example Labour Society", exact: true })
    .waitFor();
  await page.getByRole("link", { name: "Edit record", exact: true }).click();
  await page
    .getByLabel("Society name (required)")
    .fill("Example Labour Society Updated");
  await page
    .getByLabel("Reason for change (required)")
    .fill("Approved Society name revision");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page
    .getByRole("heading", {
      name: "Example Labour Society Updated",
      exact: true,
    })
    .waitFor();
  await visit("?page=departments&new=1");
  await page
    .getByLabel("Department name (required)")
    .fill("PWD example division");
  await page.getByLabel("Division", { exact: true }).fill("Pune");
  await page.getByRole("button", { name: "Create record" }).click();
  await page
    .getByRole("heading", { name: "PWD example division", exact: true })
    .waitFor();
  await visit("?page=banks&new=1");
  await page.getByLabel("Account nickname (required)").fill("Operations");
  await page
    .locator("#f-societyId")
    .selectOption({ label: "Example Labour Society Updated" });
  await page.getByLabel("Bank name (required)").fill("Example Bank");
  await page.getByLabel("Account number (required)").fill("123456789012");
  await page.getByLabel("IFSC (required)").fill("SBIN0001234");
  await page.getByLabel("Opening balance date (required)").fill("2026-04-01");
  await page.getByRole("button", { name: "Create record" }).click();
  await page
    .getByRole("heading", { name: "Operations", exact: true })
    .waitFor();
  assert(await page.getByText("•••• 9012", { exact: true }).isVisible());
  await page.getByRole("button", { name: "Reveal masked details" }).click();
  await page.getByText("123456789012", { exact: true }).waitFor();
  assert.equal(
    await page
      .locator("#detail-fields")
      .getByText("Status", { exact: true })
      .count(),
    1,
  );
  assert.equal(
    await page
      .locator("#detail-fields")
      .getByText("Active", { exact: true })
      .count(),
    1,
  );
  await visit("?page=projects&new=1");
  await page.getByLabel("Project name (required)").fill("Example road repair");
  await page
    .locator("#f-societyId")
    .selectOption({ label: "Example Labour Society Updated" });
  assert.equal(
    await page.getByLabel("Working percentage (%)").inputValue(),
    "5.25",
  );
  await page
    .locator("#f-departmentId")
    .selectOption({ label: "PWD example division" });
  await page.getByLabel("Work order number (required)").fill("WO-2026-01");
  await page.getByLabel("Work order date (required)").fill("2026-05-01");
  await page
    .getByLabel("Approved contract value (INR) (required)")
    .fill("1000000.25");
  await page.getByRole("button", { name: "Create record" }).click();
  await page
    .getByRole("heading", { name: "Example road repair", exact: true })
    .waitFor();
  await visit("?page=beneficiaries&new=1");
  await page.getByLabel("Beneficiary name (required)").fill("Example supplier");
  await page
    .locator("#f-societyId")
    .selectOption({ label: "Example Labour Society Updated" });
  await page.getByRole("button", { name: "Create record" }).click();
  await page
    .getByRole("heading", { name: "Example supplier", exact: true })
    .waitFor();
  await visit("?page=societies");
  await page.getByRole("heading", { name: "1 record", exact: true }).waitFor();
  await check("societies-desktop");
  await page.getByLabel("Search records").fill("not-a-match");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await page.getByRole("heading", { name: "No matching records" }).waitFor();
  assert(new URL(page.url()).searchParams.get("q") === "not-a-match");
  await page.reload();
  await page.getByRole("heading", { name: "No matching records" }).waitFor();
  await page.getByRole("link", { name: "Clear filters" }).click();
  await visit("?page=audit");
  await page
    .getByRole("heading", { name: "Audit history", exact: true })
    .waitFor();
  await check("audit-desktop");
  await visit("?page=overview");
  await page
    .getByRole("heading", { name: "Your records, ready for work." })
    .waitFor();
  await check("overview-populated");
  await page.setViewportSize({ width: 375, height: 812 });
  await check("overview-mobile");
  await visit("?page=societies");
  await page.getByRole("heading", { name: "1 record", exact: true }).waitFor();
  await check("societies-mobile");
  await page
    .getByRole("link", { name: "Open Example Labour Society Updated" })
    .click();
  await page.getByRole("link", { name: "Edit record", exact: true }).click();
  await check("form-mobile");
  await page.setViewportSize({ width: 812, height: 375 });
  await check("form-landscape");
  await page.reload();
  await page
    .getByRole("heading", { name: "Edit Society", exact: true })
    .waitFor();
  assert.equal(
    await page.getByLabel("Society name (required)").inputValue(),
    "Example Labour Society Updated",
  );
  assert.deepEqual(
    externalRequests,
    [],
    "The offline app must not request external resources",
  );
  assert.deepEqual(errors, []);
  writeFileSync(
    "artifacts/ui-results.json",
    JSON.stringify(
      {
        workflow: "passed",
        externalRequests,
        offline: "External requests blocked; local loopback only",
        checks: results,
        consoleErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log(
    `UI workflow passed; ${results.length} responsive/axe checkpoints passed.`,
  );
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
  store.close();
  // Only the exact temporary directory created by this script is removed.
  assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
  rmSync(directory, { recursive: true, force: true });
}
