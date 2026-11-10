import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";
import { Store, LOCAL_ACTOR as actor } from "../src/store.mjs";
import { createApp } from "../src/server.mjs";

const directory = mkdtempSync(join(tmpdir(), "fundtrace-phase4-ui-"));
const store = new Store(directory),
  server = createApp(store);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const society = store.save(actor, "societies", null, {
  name: "Test Society",
  code: "TS",
  effectiveDate: "2026-04-01",
});
const department = store.save(actor, "departments", null, {
  name: "Test Department",
});
const project = store.save(actor, "projects", null, {
  name: "Test Project",
  societyId: society.id,
  departmentId: department.id,
  workOrder: "WO",
  workOrderDate: "2026-04-01",
  contractValue: "10000",
  projectStatus: "In Progress",
});
const bank = store.save(actor, "banks", null, {
  name: "Test Bank",
  societyId: society.id,
  bankName: "Bank",
  accountNumber: "123456789",
  ifsc: "SBIN0001234",
  accountType: "Current",
  openingBalance: "100",
  openingDate: "2026-04-01",
});
const evidence = {
  name: "certificate.pdf",
  data: Buffer.from("%PDF-1.4\nEvidence").toString("base64"),
};
let receipt = store.saveReceipt(actor, null, {
  societyId: society.id,
  departmentId: department.id,
  projectId: project.id,
  bankId: bank.id,
  creditDate: "2026-04-02",
  valueDate: "2026-04-02",
  amount: "1000",
  reference: "UTR1",
});
receipt = store.addEvidence(actor, receipt.id, {
  ...evidence,
  revision: receipt.revision,
});
receipt = store.postReceipt(actor, receipt.id, {
  confirm: true,
  revision: receipt.revision,
});
const results = [],
  external = [],
  errors = [];
mkdirSync("artifacts", { recursive: true });
let browser;
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
  const visit = async (pageName, query = "") => {
    await page.goto(`${origin}/?page=${pageName}${query}`);
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
  const confirm = async (form, button) => {
    const scope = page.locator(form);
    await scope.locator("[name=confirm]").check();
    await scope.getByRole("button", { name: button, exact: true }).click();
  };
  const fill = async (form, values) => {
    for (const [name, value] of Object.entries(values)) {
      const input = page.locator(`${form} [name="${name}"]`);
      if (await input.evaluate((el) => el.tagName === "SELECT"))
        await input.selectOption(value);
      else await input.fill(value);
    }
  };
  await visit("bankmovements", "&new=1");
  await fill("#movement-form", {
    bankId: bank.id,
    date: "2026-04-03",
    category: "Bank charge",
    amount: "10",
    reference: "CHARGE1",
    reason: "Bank service fee verified",
  });
  await confirm("#movement-form", "Post bank movement");
  await page.getByRole("heading", { name: /ADJ-/ }).waitFor();
  await check("phase4-bank-adjustment");
  assert.equal(store.bankBook()[0].balance, 109000);
  await visit("reconciliation", "&new=1");
  await fill("#statement-form", {
    bankId: bank.id,
    start: "2026-04-01",
    end: "2026-04-30",
    opening: "100",
    closing: "1090",
  });
  await page
    .locator("#manual-statement")
    .fill(
      "Date,Reference,Narration,Debit,Credit,Balance\n2026-04-02,UTR1,Receipt,,1000,1100\n2026-04-03,CHARGE1,Fee,10,,1090",
    );
  await page
    .getByRole("button", { name: "Read statement", exact: true })
    .click();
  await page.locator("#map-date").waitFor();
  await page
    .getByRole("button", { name: "Preview import", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Review 2 statement rows" })
    .waitFor();
  await check("phase4-import-preview");
  await page.setViewportSize({ width: 375, height: 812 });
  await check("phase4-import-mobile");
  await page.setViewportSize({ width: 1440, height: 900 });
  await confirm("#import-confirm", "Import reviewed statement");
  await page
    .getByRole("heading", { name: "manual-statement.csv", exact: true })
    .waitFor();
  const statement = store.statementImports()[0];
  const downloaded = await context.request.get(
    `${origin}/api/statements/${statement.id}/source`,
  );
  assert.match(downloaded.headers()["content-disposition"], /attachment/);
  assert.match(await downloaded.text(), /CHARGE1/);
  for (const line of store.statementImport(statement.id).lines) {
    await visit("reconciliation", `&line=${line.id}`);
    const movement = store
      .reconciliationMovements(bank.id)
      .find((m) => m.reference === line.reference);
    await page.locator("#movement-1").selectOption(movement.movement_key);
    await page
      .locator("#match-amount-1")
      .fill(String(Math.abs(line.amount) / 100));
    await check(`phase4-match-${line.reference}`);
    await confirm("#match-form", "Confirm matches");
    await page
      .getByRole("button", { name: "Remove match", exact: true })
      .waitFor();
  }
  await visit("periods");
  await fill("#period-form", {
    bankId: bank.id,
    start: "2026-04-01",
    end: "2026-04-30",
    reason: "Statement and book fully reconciled",
  });
  await confirm("#period-form", "Lock reconciled period");
  await page.getByRole("button", { name: "Reopen", exact: true }).waitFor();
  await check("phase4-locked-period");
  await page.getByRole("button", { name: "Reopen", exact: true }).click();
  await fill("#reopen-form", { reason: "Accountant approved correction" });
  await confirm("#reopen-form", "Confirm reopening");
  await page.getByText("Reopened", { exact: true }).waitFor();
  await visit("taxrules");
  await fill("#rule-form", {
    societyId: society.id,
    taxType: "Confirmed deduction",
    rate: "2",
    effectiveFrom: "2026-04-01",
    basis: "Confirmed bill base",
    evidenceReference: "Accountant memo 1",
    reason: "Accountant reviewed treatment",
  });
  await confirm("#rule-form", "Save tax treatment");
  await page
    .getByRole("cell", { name: "Confirmed deduction", exact: true })
    .waitFor();
  await check("phase4-tax-rules");
  await visit("tax", "&new=1");
  await fill("#tax-form", {
    societyId: society.id,
    projectId: project.id,
    date: "2026-04-02",
    ruleId: store.taxRules()[0].id,
    receiptId: receipt.id,
    reference: "CERT1",
    base: "1000",
    deducted: "20",
    bankAmount: "1000",
  });
  await page.locator("#support-file").setInputFiles({
    name: evidence.name,
    mimeType: "application/pdf",
    buffer: Buffer.from(evidence.data, "base64"),
  });
  await confirm("#tax-form", "Create tax record");
  await page.getByRole("heading", { name: /TAX-/ }).waitFor();
  for (const [kind, amount, reference] of [
    ["Credit", "20", "LEDGER1"],
    ["Set-off", "5", "SETOFF1"],
  ]) {
    await fill("#tax-event", {
      kind,
      date: "2026-04-03",
      amount,
      reference,
      reason: "Verified tax ledger evidence",
    });
    await page.locator("#support-file").setInputFiles({
      name: evidence.name,
      mimeType: "application/pdf",
      buffer: Buffer.from(evidence.data, "base64"),
    });
    await confirm("#tax-event", "Record tax event");
    await page.getByRole("cell", { name: reference, exact: true }).waitFor();
  }
  await check("phase4-tax-detail");
  await page.setViewportSize({ width: 375, height: 812 });
  await check("phase4-tax-mobile");
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit("tax");
  await check("phase4-tax-register");
  assert.equal(store.taxes()[0].available, 1500);
  assert.equal(store.bankBook()[0].balance, 109000);
  assert.equal(store.receipt(receipt.id).available, 100000);
  // A real workbook exercises the bundled parser, worksheet selection and text-date mapping.
  const sandbox = {};
  vm.runInNewContext(
    readFileSync("public/vendor/xlsx.full.min.js", "utf8"),
    sandbox,
  );
  const xlsx = sandbox.XLSX,
    workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(
    workbook,
    xlsx.utils.aoa_to_sheet([["Ignore"], ["Other sheet"]]),
    "Notes",
  );
  xlsx.utils.book_append_sheet(
    workbook,
    xlsx.utils.aoa_to_sheet([
      ["Date", "Reference", "Narration", "Debit", "Credit", "Balance"],
      ["02/05/2026", "EXCEL1", "स्थानीय", 0, 1, 1091],
    ]),
    "Bank",
  );
  const bytes = Buffer.from(
    xlsx.write(workbook, { type: "array", bookType: "xlsx" }),
  );
  await visit("reconciliation", "&new=1");
  await fill("#statement-form", {
    bankId: bank.id,
    start: "2026-05-01",
    end: "2026-05-31",
    opening: "1090",
    closing: "1091",
    dateFormat: "DD/MM/YYYY",
  });
  await page.locator("#statement-file").setInputFiles({
    name: "bank.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: bytes,
  });
  await page
    .getByRole("button", { name: "Read statement", exact: true })
    .click();
  await page.locator("#statement-sheet").selectOption("Bank");
  await page
    .locator("#map-date option", { hasText: "Date" })
    .waitFor({ state: "attached" });
  await page
    .getByRole("button", { name: "Preview import", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Review 1 statement rows" })
    .waitFor();
  await confirm("#import-confirm", "Import reviewed statement");
  await page.getByRole("heading", { name: "bank.xlsx", exact: true }).waitFor();
  assert.equal(store.statementImports().length, 2);
  assert.equal(
    store.statementLines(bank.id).find((l) => l.reference === "EXCEL1")
      .narration,
    "स्थानीय",
  );
  await check("phase4-excel-import");
  await visit("reconciliation", "&new=1");
  await fill("#statement-form", {
    bankId: bank.id,
    start: "2026-05-01",
    end: "2026-05-31",
    opening: "1090",
    closing: "1091",
  });
  await page
    .locator("#manual-statement")
    .fill("Date,Reference,Debit,Credit,Balance\n2026-05-02,CHANGED,0,1,1091");
  await page
    .getByRole("button", { name: "Read statement", exact: true })
    .click();
  await page.locator("#map-date").waitFor();
  await page
    .getByRole("button", { name: "Preview import", exact: true })
    .click();
  await page
    .locator("#import-confirm .error")
    .filter({ hasText: "overlaps" })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Import reviewed statement", exact: true })
      .isDisabled(),
    true,
  );
  await check("phase4-overlap-preview");
  const parsedCsv = await page.evaluate(async () => {
    const worker = new Worker("/statement-worker.js");
    return await new Promise((resolve, reject) => {
      worker.onmessage = ({ data }) => {
        worker.terminate();
        resolve(data);
      };
      worker.onerror = () => {
        worker.terminate();
        reject(new Error("Worker failed"));
      };
      worker.postMessage({
        buffer: new TextEncoder().encode(
          "Date,Narration,Debit,Credit\n2026-05-02,स्थानीय,0,1",
        ).buffer,
      });
    });
  });
  assert.equal(parsedCsv.rows[1][1], "स्थानीय");
  const longBook = xlsx.utils.book_new();
  const longSheet = xlsx.utils.aoa_to_sheet([
    ["Date", "Credit"],
    ["2026-05-02", 1],
  ]);
  xlsx.utils.sheet_add_aoa(longSheet, [["2026-05-03", 1]], { origin: "A2100" });
  xlsx.utils.book_append_sheet(longBook, longSheet, "Long");
  const longBytes = [
    ...new Uint8Array(
      xlsx.write(longBook, { type: "array", bookType: "xlsx" }),
    ),
  ];
  const limited = await page.evaluate(async (bytes) => {
    const worker = new Worker("/statement-worker.js");
    return await new Promise((resolve, reject) => {
      worker.onmessage = ({ data }) => {
        worker.terminate();
        resolve(data);
      };
      worker.onerror = () => {
        worker.terminate();
        reject(new Error("Worker failed"));
      };
      worker.postMessage({ buffer: new Uint8Array(bytes).buffer });
    });
  }, longBytes);
  assert.match(limited.error, /2,000/);
  assert.deepEqual(external, []);
  assert.deepEqual(errors, []);
  writeFileSync(
    "artifacts/phase4-ui-results.json",
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
    `Phase 4: ${results.length} UI checkpoints passed; no external requests, accessibility violations, overflow or browser errors.`,
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  store.close();
  rmSync(directory, { recursive: true, force: true });
}
