import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";
import { createApp } from "../src/server.mjs";
import { reportFixture, actor } from "../test/support/report-fixture.mjs";
const f = reportFixture(),
  server = createApp(f.store);
for (let i = 0; i < 26; i++)
  f.receipt("1", "2026-04-04", { billNumber: "=1+1" });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
mkdirSync("artifacts", { recursive: true });
const sandbox = {};
vm.runInNewContext(
  readFileSync("public/vendor/xlsx.full.min.js", "utf8"),
  sandbox,
);
const XLSX = sandbox.XLSX;
let browser;
const results = [],
  external = [],
  errors = [];
try {
  browser = await chromium.launch(
    process.platform === "win32" ? { channel: "msedge" } : {},
  );
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
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
  const visit = async (name, query = "") => {
    await page.goto(`${origin}/?page=${name}${query}`);
    await page.locator("h1").waitFor();
  };
  const check = async (name) => {
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      audit.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
      name,
    );
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `${name}: overflow`,
    );
    await page.screenshot({ path: `artifacts/${name}.png`, fullPage: true });
    results.push(name);
  };
  await visit("dashboard", "&period=month&month=2026-04");
  await page
    .getByRole("heading", { name: "Financial dashboard", exact: true })
    .waitFor();
  await check("phase5-dashboard-desktop");
  await page
    .getByRole("link", { name: "Open consolidated report", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Reports & exports", exact: true })
    .waitFor();
  assert(new URL(page.url()).searchParams.get("month") === "2026-04");
  await check("phase5-summary-desktop");
  await page.setViewportSize({ width: 375, height: 812 });
  await check("phase5-summary-mobile");
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit("search");
  await page
    .locator("#report-filter [name=q]")
    .fill(f.r.paymentId.toLowerCase());
  await page
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await page.getByText("1–1 of 1 records", { exact: true }).waitFor();
  await page.getByRole("link", { name: "Open record", exact: true }).click();
  await page
    .getByRole("heading", { name: "Payment ID 360", exact: true })
    .waitFor();
  await page
    .getByRole("heading", { name: "Related tax records", exact: true })
    .waitFor();
  await page
    .locator("details")
    .filter({
      has: page.locator("summary", { hasText: `${f.p.ref} evidence` }),
    })
    .locator("summary")
    .click();
  assert.equal(
    await page.getByRole("link", { name: "bank.pdf", exact: true }).count(),
    2,
  );
  await check("phase5-trace-desktop");
  await page.setViewportSize({ width: 375, height: 812 });
  await check("phase5-trace-mobile");
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit("reports", "&type=receipts&period=month&month=2026-04");
  await page.getByText("1–25 of 27 records", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await page.getByText("26–27 of 27 records", { exact: true }).waitFor();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export Excel (.xlsx)", exact: true })
    .click();
  const download = await downloadPromise;
  await download.saveAs("artifacts/phase5-receipts.xlsx");
  const book = XLSX.read(
    new Uint8Array(readFileSync("artifacts/phase5-receipts.xlsx")),
    { type: "array", cellNF: true },
  );
  const values = XLSX.utils.sheet_to_json(book.Sheets.Records, { header: 1 });
  assert.equal(values.length, 29);
  const amountColumn = values[0].indexOf("Signed bank credit"),
    billColumn = values[0].indexOf("Bill"),
    dateColumn = values[0].indexOf("Bank movement date");
  assert.equal(values.at(-1)[amountColumn], 1026);
  assert.equal(typeof values[1][amountColumn], "number");
  assert.equal(
    book.Sheets.Records[XLSX.utils.encode_cell({ r: 1, c: billColumn })].t,
    "s",
  );
  assert.equal(
    book.Sheets.Records[XLSX.utils.encode_cell({ r: 1, c: billColumn })].f,
    undefined,
  );
  assert.equal(
    book.Sheets.Records[XLSX.utils.encode_cell({ r: 1, c: dateColumn })].z,
    "yyyy-mm-dd",
  );
  const dateCell =
    book.Sheets.Records[XLSX.utils.encode_cell({ r: 1, c: dateColumn })];
  assert.equal(dateCell.t, "n");
  assert.equal(dateCell.v, 46114);
  assert.equal(dateCell.w, "2026-04-02");
  assert(JSON.stringify(values).includes("=1+1"));
  assert(!JSON.stringify(book).includes("123456789"));
  await page.evaluate(() => {
    window.print = () => {
      window.__printCalled = true;
    };
  });
  await page
    .getByRole("button", { name: "Print / save PDF", exact: true })
    .click();
  await page
    .getByText(
      "Print view prepared. Choose Save as PDF for a local PDF file.",
      { exact: true },
    )
    .waitFor();
  assert(await page.evaluate(() => window.__printCalled));
  assert.equal(await page.locator("#print-report tbody tr").count(), 27);
  await page.pdf({
    path: "artifacts/phase5-receipts.pdf",
    preferCSSPageSize: true,
    printBackground: true,
  });
  await page.emulateMedia({ media: "print" });
  await page.screenshot({
    path: "artifacts/phase5-print-preview.png",
    fullPage: true,
  });
  await page.emulateMedia({ media: "screen" });
  await check("phase5-receipts-export");
  for (const type of [
    "supplier",
    "subcontractor",
    "labour",
    "utilisation",
    "pending",
    "projects",
    "reconciliation",
    "tax",
  ]) {
    await visit("reports", `&type=${type}&period=all`);
    await page.locator("#page-count").waitFor();
    await check(`phase5-report-${type}`);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await check("phase5-tax-mobile");
  await visit("dashboard", "&period=month&month=2026-04");
  await check("phase5-dashboard-mobile");
  await page.setViewportSize({ width: 812, height: 375 });
  await check("phase5-dashboard-landscape");
  await visit("search", `&q=${f.r.id}`);
  await page
    .getByRole("heading", { name: "No matching records", exact: true })
    .waitFor();
  await check("phase5-search-empty");
  assert(
    f.store
      .auditList(actor)
      .filter((a) => a.action === "Report export prepared").length === 2,
  );
  assert.deepEqual(external, []);
  assert.deepEqual(errors, []);
  writeFileSync(
    "artifacts/phase5-ui-results.json",
    JSON.stringify(
      {
        checkpoints: results,
        externalRequests: external,
        browserErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log(
    `Phase 5: ${results.length} responsive/axe checkpoints passed; Excel amounts, dates, formula safety, all-row export and printable PDF verified offline.`,
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  f.close();
}
