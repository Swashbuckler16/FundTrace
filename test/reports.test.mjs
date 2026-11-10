import { test } from "node:test";
import assert from "node:assert/strict";
import {
  report,
  search,
  trace,
  dashboard,
  reportCatalog,
} from "../src/reports.mjs";
import { reportFixture, actor } from "./support/report-fixture.mjs";
import { createApp } from "../src/server.mjs";
function fixture(t) {
  const f = reportFixture();
  t.after(f.close);
  return f;
}
test("monthly cash preserves historical postings and applies reversals only on their own dates", (t) => {
  const f = fixture(t),
    before = report(f.store, actor, { period: "month", month: "2026-04" });
  assert.equal(before.totals.opening, 10000);
  assert.equal(before.totals.closing, 80000);
  assert.equal(before.totals.supplier, 30000);
  f.store.reverseFinancial(actor, "payments", f.p.id, {
    confirm: true,
    revision: f.p.revision,
    date: "2026-05-02",
    reference: "RETURN1",
    reason: "Confirmed payment refund by bank",
  });
  const april = report(f.store, actor, { period: "month", month: "2026-04" }),
    may = report(f.store, actor, { period: "month", month: "2026-05" });
  assert.deepEqual(april.totals, before.totals);
  assert.equal(may.totals.opening, 80000);
  assert.equal(may.totals.credits, 30000);
  assert.equal(may.totals.supplier, -30000);
  assert.equal(may.totals.closing, 110000);
  assert.equal(
    may.metrics["Period tax credits / adjustments (not cash)"],
    2000,
  );
  assert.equal(april.metrics["Period tax credits / adjustments (not cash)"], 0);
  assert.equal(april.metrics["Current available tax credit (not cash)"], 2000);
  const payments = report(f.store, actor, { type: "supplier", period: "all" });
  assert.equal(payments.rows.length, 2);
  assert.equal(payments.totals.amount, 0);
  f.store.saveBankMovement(actor, {
    confirm: true,
    bankId: f.bank.id,
    date: "2026-05-03",
    category: "Bank charge",
    amount: "10",
    reference: "CHARGE1",
    reason: "Monthly bank fee checked",
  });
  const charged = report(f.store, actor, { period: "month", month: "2026-05" });
  assert.equal(charged.totals.otherDebits, 1000);
  assert.equal(charged.totals.bankCharges, 1000);
  assert.equal(charged.totals.closing, 109000);
});
test("financial-year boundary, opening dates, drafts and scoped filtering preserve cash totals", (t) => {
  const f = fixture(t);
  f.receipt("1", "2027-03-31");
  f.receipt("2", "2027-04-01");
  f.store.saveReceipt(actor, null, {
    societyId: f.society.id,
    amount: "999999",
  });
  const old = report(f.store, actor, { year: "2026" }),
    next = report(f.store, actor, { year: "2027" });
  assert.equal(old.totals.receiptNet, 100100);
  assert.equal(next.totals.receiptNet, 200);
  assert.equal(next.totals.opening, 80100);
  assert.equal(
    report(f.store, actor, { period: "month", month: "2026-03" }).rows.length,
    0,
  );
  assert.throws(
    () =>
      report(f.store, actor, {
        period: "custom",
        from: "2026-05-01",
        to: "2026-04-01",
      }),
    /From/,
  );
  assert.throws(
    () => report(f.store, actor, { project: f.project.id }),
    /Society, bank/,
  );
  assert.throws(
    () => report(f.store, actor, { society: "missing" }),
    /Unknown/,
  );
  assert.throws(
    () => search(f.store, actor, { min: "2", max: "1" }),
    /Minimum/,
  );
});
test("split-funded payments and multi-beneficiary batches do not duplicate cash or report distributions", (t) => {
  const f = fixture(t),
    r2 = f.receipt("500"),
    c2 = f.claim("600");
  f.payment(f.r, c2, "400", "2026-04-04", {
    allocations: [
      { receiptId: f.r.id, amount: "200" },
      { receiptId: r2.id, amount: "200" },
    ],
  });
  const supplier = report(f.store, actor, { type: "supplier", period: "all" });
  assert.equal(supplier.totals.amount, 70000);
  assert.equal(supplier.rows.length, 2);
  assert.match(supplier.rows[1].receiptIds, new RegExp(r2.paymentId));
  const workers = [1, 2].map((i) =>
    f.store.save(actor, "beneficiaries", null, {
      name: `Worker ${i}`,
      societyId: f.society.id,
      category: "Individual labourer",
    }),
  );
  const claims = workers.map((w) =>
    f.claim("100", w, {
      quantity: "1",
      rate: "100",
      periodStart: "2026-04-01",
      periodEnd: "2026-04-02",
      certification: "ATTENDANCE",
    }),
  );
  f.payment(r2, claims[0], "100", "2026-04-05", {
    batch: true,
    distributions: claims.map((c) => ({ claimId: c.id, amount: "100" })),
    allocations: [{ receiptId: r2.id, amount: "200" }],
  });
  const labour = report(f.store, actor, { type: "labour", period: "all" });
  assert.equal(labour.rows.length, 2);
  assert.equal(labour.totals.amount, 20000);
  const summary = report(f.store, actor, { period: "all" });
  assert.equal(summary.totals.debits, 90000);
  assert.equal(summary.totals.labour, 20000);
  assert.equal(summary.totals.closing, 70000);
  const projects = report(f.store, actor, { type: "projects", period: "all" });
  assert.equal(projects.totals.supplier, 70000);
  assert.equal(projects.totals.labour, 20000);
});
test("all report definitions have source links, typed amounts and no structured private fields", (t) => {
  const f = fixture(t);
  for (const type of Object.keys(reportCatalog)) {
    const result = report(f.store, actor, { type, period: "all" });
    assert(result.columns.length);
    assert(result.dateBasis);
    assert(result.notes);
    assert(!JSON.stringify(result).includes("123456789"));
    assert(!JSON.stringify(result).includes("9876543210"));
    for (const row of result.rows) {
      assert(row._page);
      for (const c of result.columns.filter((c) => c.type === "money"))
        assert(Number.isSafeInteger(row[c.key]));
    }
  }
  assert.equal(
    report(f.store, actor, { type: "pending", period: "all" }).totals.amount,
    50000,
  );
  assert.equal(
    dashboard(f.store, actor, { period: "all" }).totals.closing,
    80000,
  );
});
test("global search and Payment ID 360 link receipts, evidence, allocations, tax and chronological activity", (t) => {
  const f = fixture(t),
    exact = search(f.store, actor, { q: f.r.paymentId.toLowerCase() });
  assert.equal(exact.rows[0]._id, f.r.id);
  assert.equal(exact.rows[0]._page, "trace");
  assert.equal(search(f.store, actor, { q: f.r.id }).rows.length, 0);
  assert.equal(search(f.store, actor, { q: "trace" }).rows.length, 0);
  assert.equal(
    report(f.store, actor, { type: "receipts", period: "all", q: f.r.id }).rows
      .length,
    0,
  );
  assert.equal(
    report(f.store, actor, {
      type: "utilisation",
      period: "all",
      q: f.r.paymentId,
    }).rows.length,
    1,
  );
  assert.equal(search(f.store, actor, { q: f.supplier.ref }).rows.length, 2);
  assert(search(f.store, actor, { q: "wo-report" }).rows.length >= 3);
  assert.equal(
    search(f.store, actor, {
      beneficiary: f.supplier.id,
      category: "Supplier",
      min: "300",
      max: "300",
    }).rows.length,
    1,
  );
  const view = trace(f.store, actor, f.r.paymentId);
  assert.equal(view.receipt.available, 70000);
  assert.equal(view.payments[0].allocatedFromReceipt, 30000);
  assert.equal(view.taxes.length, 1);
  assert.equal(view.receipt.evidence.length, 1);
  assert(view.timeline.every((x, i, a) => !i || a[i - 1].id < x.id));
});
test("HTTP report exports are local, audited, validated and return the same filtered totals", async (t) => {
  const f = fixture(t),
    server = createApp(f.store);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${origin}/api/report-export`, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "X-FundTrace-Local": "1",
    },
    body: JSON.stringify({
      format: "xlsx",
      filters: { type: "summary", period: "month", month: "2026-04" },
    }),
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).totals.closing, 80000);
  assert(
    f.store.auditList(actor).some((a) => a.action === "Report export prepared"),
  );
  assert.equal(
    (
      await fetch(`${origin}/api/report-export`, {
        method: "POST",
        headers: {
          Origin: "https://evil.invalid",
          "Content-Type": "application/json",
        },
        body: "{}",
      })
    ).status,
    403,
  );
});
