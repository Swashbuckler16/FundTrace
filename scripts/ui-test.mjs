import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { Store, LOCAL_ACTOR } from "../src/store.mjs";
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
  await page.setViewportSize({ width: 1440, height: 1000 });
  await visit("?page=receipts&new=1");
  await page
    .locator("#f-societyId")
    .selectOption({ label: "Example Labour Society Updated" });
  await page
    .locator("#f-departmentId")
    .selectOption({ label: "PWD example division" });
  await page
    .locator("#f-projectId")
    .selectOption({ label: "Example road repair — WO-2026-01" });
  await page.locator("#f-bankId").selectOption({ label: "Operations" });
  await page.locator("#f-creditDate").fill("2026-05-04");
  await page.locator("#f-valueDate").fill("2026-05-05");
  await page.locator("#f-amount").fill("12500.25");
  await page.locator("#f-reference").fill("TEST-UTR-01");
  await page.locator("#f-gstDeduction").fill("1000");
  await check("receipt-form-desktop");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page
    .getByRole("heading", { name: "Receipt draft", exact: true })
    .waitFor();
  const receiptUrl = page.url();
  const receiptId = new URL(receiptUrl).searchParams.get("id");
  assert.equal(store.receipt(receiptId).available, 0);
  assert.equal(store.bankBook()[0].balance, 0);
  await page.locator("#confirm-post").check();
  await page.getByRole("button", { name: "Post confirmed receipt" }).click();
  await page
    .getByText("Attach bank evidence before posting.", { exact: true })
    .waitFor();
  await page.locator("#evidence-file").setInputFiles({
    name: "bank-advice.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\nUI evidence"),
  });
  await page.getByRole("button", { name: "Attach evidence" }).click();
  await page.getByRole("link", { name: "bank-advice.pdf" }).waitFor();
  await check("receipt-draft-desktop");
  await page.locator("#confirm-post").check();
  await page.getByRole("button", { name: "Post confirmed receipt" }).click();
  await page.getByRole("heading", { name: /^LSP-/ }).waitFor();
  assert.equal(store.receipt(receiptId).available, 1250025);
  assert.equal(await page.getByRole("link", { name: "Edit draft" }).count(), 0);
  await check("receipt-posted-desktop");
  await page.setViewportSize({ width: 375, height: 812 });
  await check("receipt-posted-mobile");
  await visit("?page=bankbook");
  await page.getByRole("heading", { name: "Bank book", exact: true }).waitFor();
  assert.equal(store.bankBook()[0].balance, 1250025);
  await check("bankbook-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await check("bankbook-desktop");
  await visit("?page=receipts");
  await page
    .locator('#receipt-filter select[name="status"]')
    .selectOption("Posted");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await page.getByRole("link", { name: /Open LSP-/ }).waitFor();
  await page.reload();
  await page.getByRole("link", { name: /Open LSP-/ }).waitFor();
  await check("receipt-register-desktop");
  await page.setViewportSize({ width: 375, height: 812 });
  await check("receipt-register-mobile");
  await visit("?page=receipts&new=1");
  await check("receipt-form-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await visit("?page=claims&new=1");
  await page
    .locator("#f-societyId")
    .selectOption({ label: "Example Labour Society Updated" });
  await page
    .locator("#f-projectId")
    .selectOption({ label: "Example road repair" });
  await page
    .locator("#f-beneficiaryId")
    .selectOption({ label: "Example supplier" });
  await page.locator("#f-reference").fill("INV-UI-01");
  await page.locator("#f-invoiceDate").fill("2026-05-04");
  await page.locator("#f-gross").fill("1000");
  await check("claim-form-desktop");
  await page.getByRole("button", { name: "Save claim draft" }).click();
  await page.getByRole("heading", { name: /^CLM-/ }).waitFor();
  const claimId = new URL(page.url()).searchParams.get("id");
  await page.locator("#action-confirm").check();
  await page.getByRole("button", { name: "Confirm action" }).click();
  await page.getByText(/^Approved, entered/).waitFor();
  await check("claim-approved-desktop");
  await visit("?page=payments&new=1");
  await page
    .locator("#f-societyId")
    .selectOption({ label: "Example Labour Society Updated" });
  await page
    .locator("#f-projectId")
    .selectOption({ label: "Example road repair" });
  await page.locator("#f-bankId").selectOption({ label: "Operations" });
  await page.locator("#f-paymentDate").fill("2026-05-06");
  await page.locator("#f-valueDate").fill("2026-05-06");
  await page.locator("#f-reference").fill("UI-DEBIT-01");
  await page.locator("#distribution-rows select").selectOption(claimId);
  await page.locator("#distribution-rows input").fill("250.25");
  await page.locator("#allocation-rows select").selectOption(receiptId);
  await page.locator("#allocation-rows input").fill("250.25");
  await check("payment-form-desktop");
  await page.setViewportSize({ width: 375, height: 812 });
  await check("payment-form-mobile");
  await page.getByRole("button", { name: "Save payment draft" }).click();
  await page
    .getByRole("heading", { name: "Payment draft", exact: true })
    .waitFor();
  const paymentId = new URL(page.url()).searchParams.get("id");
  await page.locator("#payment-file").setInputFiles({
    name: "payment-proof.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\nPayment advice"),
  });
  await page.getByRole("button", { name: "Attach payment evidence" }).click();
  await page.getByRole("link", { name: "payment-proof.pdf" }).waitFor();
  for (const [action, state] of [
    ["Submit for review", "Submitted"],
    ["Approve payment", "Approved"],
    ["Post confirmed bank debit", "Posted"],
  ]) {
    await page.locator("#finance-action #f-action").selectOption(action);
    await page.locator("#action-confirm").check();
    await page.getByRole("button", { name: "Confirm action" }).click();
    await page.getByText(new RegExp(`^${state}, entered`)).waitFor();
  }
  assert.equal(store.claim(claimId).pending, 74975);
  assert.equal(store.receipt(receiptId).available, 1225000);
  await check("payment-posted-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await check("payment-posted-desktop");
  await visit(`?page=receipts&id=${receiptId}`);
  await page.getByRole("link", { name: /^OUT-/ }).waitFor();
  await check("receipt-allocated-desktop");
  await visit(`?page=payments&id=${paymentId}`);
  await page.locator("#financial-reversal #f-date").fill("2026-05-07");
  await page.locator("#financial-reversal #f-reference").fill("UI-RETURN-01");
  await page
    .locator("#financial-reversal #f-reason")
    .fill("Bank returned the incorrect transfer in full");
  await page.locator("#reverse-confirm").check();
  await page.getByRole("button", { name: "Confirm reversal" }).click();
  await page.getByText(/^Reversed, entered/).waitFor();
  assert.equal(store.claim(claimId).pending, 100000);
  assert.equal(store.receipt(receiptId).available, 1250025);
  await check("payment-reversed-desktop");
  await visit(`?page=receipts&id=${receiptId}`);
  await page.getByText(/Reversed \(excluded from balances\)/).waitFor();
  await page.getByRole("link", { name: /^OUT-/ }).waitFor();
  await check("receipt-reversal-history");
  await visit(`?page=payments&id=${paymentId}`);
  await page.getByRole("link", { name: "Create corrected payment" }).click();
  await page
    .getByRole("heading", { name: "New payment", exact: true })
    .waitFor();
  assert.equal(await page.locator("#f-reference").inputValue(), "UI-DEBIT-01");
  await visit("?page=payments");
  await check("payments-register-desktop");
  await page.setViewportSize({ width: 375, height: 812 });
  await check("payments-register-mobile");
  await visit("?page=bankbook");
  await page.getByRole("heading", { name: "Bank book", exact: true }).waitFor();
  await check("bankbook-debits-mobile");
  // Isolated wage fixtures let the browser exercise multiple beneficiary rows.
  const society = store.list(LOCAL_ACTOR, "societies")[0],
    project = store.list(LOCAL_ACTOR, "projects")[0];
  const labourClaims = [];
  for (const name of ["Example worker one", "Example worker two"]) {
    const beneficiary = store.save(LOCAL_ACTOR, "beneficiaries", null, {
      name,
      societyId: society.id,
      category: "Individual labourer",
    });
    let claim = store.saveClaim(LOCAL_ACTOR, null, {
      societyId: society.id,
      projectId: project.id,
      beneficiaryId: beneficiary.id,
      reference: name + " wages",
      periodStart: "2026-05-01",
      periodEnd: "2026-05-02",
      quantity: "2",
      rate: "100",
      certification: "Test attendance sheet",
      gross: "200",
    });
    claim = store.transitionClaim(LOCAL_ACTOR, claim.id, "approve", {
      revision: claim.revision,
      confirm: true,
    });
    labourClaims.push(claim);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await visit("?page=payments&new=1");
  await page.locator("#f-societyId").selectOption(society.id);
  await page.locator("#f-projectId").selectOption(project.id);
  await page.locator("#f-bankId").selectOption({ label: "Operations" });
  await page.locator("#f-paymentDate").fill("2026-05-08");
  await page.locator("#f-valueDate").fill("2026-05-08");
  await page.locator("#f-reference").fill("LABOUR-BATCH-01");
  await page.locator("#batch").check();
  await page
    .locator("#distribution-rows select")
    .selectOption(labourClaims[0].id);
  await page.locator("#distribution-rows input").fill("200");
  await page.getByRole("button", { name: "Add claim row" }).click();
  await page
    .locator("#distribution-rows select")
    .nth(1)
    .selectOption(labourClaims[1].id);
  await page.locator("#distribution-rows input").nth(1).fill("200");
  await page.locator("#allocation-rows select").selectOption(receiptId);
  await page.locator("#allocation-rows input").fill("400");
  await check("labour-batch-desktop");
  await page.setViewportSize({ width: 375, height: 812 });
  await check("labour-batch-mobile");
  assert.match(
    await page.locator("#allocation-rows .funding-summary").innerText(),
    /available/,
  );
  await page.getByRole("button", { name: "Save payment draft" }).click();
  await page
    .getByRole("heading", { name: "Payment draft", exact: true })
    .waitFor();
  const batchId = new URL(page.url()).searchParams.get("id");
  await page.locator("#payment-file").setInputFiles({
    name: "wage-bank-proof.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\nWage schedule and bank proof"),
  });
  await page.getByRole("button", { name: "Attach payment evidence" }).click();
  await page.getByRole("link", { name: "wage-bank-proof.pdf" }).waitFor();
  for (const [action, state] of [
    ["Submit for review", "Submitted"],
    ["Approve payment", "Approved"],
    ["Post confirmed bank debit", "Posted"],
  ]) {
    await page.locator("#finance-action #f-action").selectOption(action);
    await page.locator("#action-confirm").check();
    await page.getByRole("button", { name: "Confirm action" }).click();
    await page.getByText(new RegExp(`^${state}, entered`)).waitFor();
  }
  assert.equal(store.payment(batchId).distributions.length, 2);
  assert.equal(
    store.bankBook()[0].entries.filter((e) => e.entity_id === batchId).length,
    1,
  );
  assert.equal(store.claim(labourClaims[0].id).pending, 0);
  assert.equal(store.receipt(receiptId).available, 1210025);
  await check("labour-batch-posted-mobile");
  await page.locator("#financial-reversal #f-date").fill("2026-05-09");
  await page.locator("#financial-reversal #f-reference").fill("BATCH-RETURN");
  await page
    .locator("#financial-reversal #f-reason")
    .fill("Bank returned the complete labour batch");
  await page.locator("#reverse-confirm").check();
  await page.getByRole("button", { name: "Confirm reversal" }).click();
  await page.getByText(/^Reversed, entered/).waitFor();
  await visit(`?page=receipts&id=${receiptId}`);
  await page.locator("#financial-reversal #f-date").fill("2026-05-10");
  await page.locator("#financial-reversal #f-reference").fill("CREDIT-RETURN");
  await page
    .locator("#financial-reversal #f-reason")
    .fill("Bank reversed the original receipt credit");
  await page.locator("#reverse-confirm").check();
  await page.getByRole("button", { name: "Confirm reversal" }).click();
  await page.getByText(/This receipt is reversed\./).waitFor();
  assert.equal(
    await page
      .getByText(/Drafts do not affect balances or receive a Payment ID/)
      .count(),
    0,
  );
  assert.equal(store.receipt(receiptId).available, 0);
  assert.equal(store.bankBook()[0].balance, 0);
  await check("receipt-reversed-mobile");
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
