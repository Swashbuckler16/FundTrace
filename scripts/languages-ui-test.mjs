import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { createApp } from "../src/server.mjs";
import { reportFixture, actor } from "../test/support/report-fixture.mjs";
const f = reportFixture(),
  server = createApp(f.store);
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(
  process.platform === "win32" ? { channel: "msedge" } : {},
);
const gaps = {},
  errors = [],
  external = [],
  englishText = new Set();
const technicalText = new Set([
  "DD/MM/YYYY",
  "YYYY-MM-DD",
  "Date,Reference,Narration,Debit,Credit,Balance",
  "F",
  "FundTrace",
  "GSTIN",
  "ID",
  "IFSC",
  "IMPS",
  "MHADA",
  "NEFT",
  "PAN",
  "PWD",
  "RTGS",
  "UPI",
  "Restore FundTrace.cmd",
  "Unlock FundTrace.cmd",
]);
mkdirSync("artifacts", { recursive: true });
const routes = [
  "settings",
  "overview",
  "societies",
  "societies&new=1",
  `societies&id=${f.society.id}`,
  `societies&id=${f.society.id}&edit=1`,
  "departments&new=1",
  "projects&new=1",
  "banks&new=1",
  "beneficiaries&new=1",
  "receipts",
  "receipts&new=1",
  `receipts&id=${f.r.id}`,
  "claims",
  "claims&new=1",
  `claims&id=${f.c.id}`,
  "payments",
  "payments&new=1",
  `payments&id=${f.p.id}`,
  "bankbook",
  "reconciliation",
  "reconciliation&new=1",
  "bankmovements",
  "bankmovements&new=1",
  "periods",
  "tax",
  "tax&new=1",
  `tax&id=${f.tax.id}`,
  "taxrules",
  "audit",
  "numbering",
  "recovery",
  "search",
  "dashboard",
  ...[
    "receipts",
    "payments",
    "supplier",
    "subcontractor",
    "labour",
    "utilisation",
    "pending",
    "projects",
    "reconciliation",
    "tax",
    "summary",
  ].map((type) => `reports&type=${type}&period=all`),
  `trace&id=${f.r.id}`,
];
try {
  const switching = await browser.newContext();
  const switchPage = await switching.newPage();
  await switchPage.goto(`${origin}/?page=settings`);
  for (const language of ["mr", "hi", "en"]) {
    await switchPage.locator("#language").selectOption(language);
    await Promise.all([
      switchPage.waitForNavigation(),
      switchPage.locator("#language-form button[type=submit]").click(),
    ]);
    assert.equal(
      await switchPage.locator("html").getAttribute("lang"),
      language,
    );
    await switchPage.reload();
    await switchPage.locator("#language").waitFor();
    assert.equal(await switchPage.locator("#language").inputValue(), language);
    const tab = await switching.newPage();
    await tab.goto(`${origin}/?page=settings`);
    await tab.locator("#language").waitFor();
    assert.equal(await tab.locator("#language").inputValue(), language);
    await tab.close();
  }
  await switching.close();
  for (const language of ["mr", "hi"]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    await context.addInitScript(
      (lang) => localStorage.setItem("fundtrace-language", lang),
      language,
    );
    await context.route("**/*", async (route) => {
      if (new URL(route.request().url()).origin !== origin) {
        external.push(route.request().url());
        await route.abort();
      } else await route.continue();
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    for (const route of routes) {
      await page.goto(`${origin}/?page=${route}`);
      await page.locator("#main h1").waitFor();
      const text = await page.locator("#main").innerText();
      assert(!text.includes("not a function"), `${language} ${route}: ${text}`);
      if (route === "beneficiaries&new=1") {
        assert(
          await page
            .locator("select[name=category] option[value=Supplier]")
            .count(),
        );
        assert.notEqual(
          await page
            .locator("select[name=category] option[value=Supplier]")
            .textContent(),
          "Supplier",
        );
      }
      gaps[`${language}:${route}`] = await page.evaluate(async () => [
        ...(await import("/i18n.js")).missingTranslations,
      ]);
      assert.deepEqual(
        gaps[`${language}:${route}`].filter((key) => !technicalText.has(key)),
        [],
        `${language}:${route} untranslated interface text`,
      );
      for (const entry of await page.locator("#main").evaluate((root) => {
        const entries = [],
          walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walk.nextNode())) {
          const text = node.textContent.trim();
          if (
            /[A-Za-z]{3,}/.test(text) &&
            !/[\u0900-\u097f]/.test(text) &&
            !node.parentElement.closest("pre,code,textarea")
          )
            entries.push(text);
        }
        return entries;
      })) {
        englishText.add(entry);
        assert(
          !["Receipt", "Payment", "New claim", "New payment"].includes(entry),
          `${language}:${route}: ${entry}`,
        );
      }
      if (["settings", "dashboard", "receipts&new=1"].includes(route)) {
        assert.deepEqual(
          (
            await new AxeBuilder({ page })
              .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
              .analyze()
          ).violations.map((v) => v.id),
          [],
        );
        await page.screenshot({
          path: `artifacts/v2-${language}-${route.replaceAll("&", "-").replaceAll("=", "-")}.png`,
          fullPage: true,
        });
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${origin}/?page=settings`);
    await page.locator("#language").waitFor();
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: `artifacts/v2-${language}-mobile.png`,
      fullPage: true,
    });
    for (const route of ["dashboard", "receipts&new=1"]) {
      await page.goto(`${origin}/?page=${route}`);
      await page.locator("#main h1").waitFor();
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${language}:${route} mobile overflow`,
      );
    }
    await page.goto(`${origin}/?page=departments&new=1`);
    await page.locator("#master-form").waitFor();
    await page.locator("#master-form button[type=submit]").click();
    assert(
      /[\u0900-\u097f]/.test(
        await page.locator("#master-form .error").innerText(),
      ),
    );
    const enteredName = language === "mr" ? "Active" : "मराठी हिंदी विभाग";
    await page.locator("#f-name").fill(enteredName);
    await page.locator("#f-type").selectOption("Other");
    await page.locator("#master-form button[type=submit]").click();
    await page.locator("#detail-fields").waitFor();
    const saved = f.store
      .list(actor, "departments")
      .find((row) => row.name === enteredName);
    assert(saved);
    assert.equal(saved.type, "Other");
    assert.equal(saved.status, "Active");
    assert((await page.locator("#main h1").innerText()).includes(enteredName));
    await context.close();
  }
  writeFileSync("artifacts/language-gaps.json", JSON.stringify(gaps, null, 2));
  writeFileSync(
    "artifacts/language-english-text.json",
    JSON.stringify([...englishText].sort(), null, 2),
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  console.log(
    `${routes.length * 2} language screens loaded; no browser errors/external requests.`,
  );
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
  f.close();
}
