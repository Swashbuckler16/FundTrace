import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { Store, LOCAL_ACTOR as actor } from "../src/store.mjs";
import { createApp } from "../src/server.mjs";

const proof = {
  name: "proof.pdf",
  data: Buffer.from("%PDF-1.4\nBank evidence").toString("base64"),
};
function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), "fundtrace-payments-")),
    store = new Store(directory);
  t.after(() => {
    store.close();
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    rmSync(directory, { recursive: true, force: true });
  });
  const society = store.save(actor, "societies", null, {
    name: "Society",
    code: "PAY",
    effectiveDate: "2026-04-01",
  });
  const department = store.save(actor, "departments", null, { name: "PWD" });
  const project = store.save(actor, "projects", null, {
    name: "Road",
    societyId: society.id,
    departmentId: department.id,
    workOrder: "WO-1",
    workOrderDate: "2026-04-01",
    projectStatus: "In Progress",
    contractValue: "10000",
  });
  const bank = store.save(actor, "banks", null, {
    name: "Operations",
    societyId: society.id,
    bankName: "Bank",
    accountNumber: "123456789",
    ifsc: "SBIN0001234",
    accountType: "Current",
    openingDate: "2026-04-01",
    openingBalance: "100",
  });
  const supplier = store.save(actor, "beneficiaries", null, {
    name: "Supplier",
    societyId: society.id,
    category: "Supplier",
  });
  let sequence = 0;
  function receipt(amount = "1000") {
    let r = store.saveReceipt(actor, null, {
      societyId: society.id,
      departmentId: department.id,
      projectId: project.id,
      bankId: bank.id,
      creditDate: "2026-04-02",
      valueDate: "2026-04-02",
      amount,
      reference: "CREDIT-" + ++sequence,
    });
    r = store.addEvidence(actor, r.id, { ...proof, revision: r.revision });
    return store.postReceipt(actor, r.id, {
      revision: r.revision,
      confirm: true,
      override: true,
      duplicateReason: "Separate advice verified for this bank credit",
    });
  }
  function claim(gross = "1000", beneficiary = supplier, extras = {}) {
    const c = store.saveClaim(actor, null, {
      societyId: society.id,
      projectId: project.id,
      beneficiaryId: beneficiary.id,
      reference: "CLAIM-" + ++sequence,
      invoiceDate: "2026-04-02",
      gross,
      ...extras,
    });
    return store.transitionClaim(actor, c.id, "approve", {
      revision: c.revision,
      confirm: true,
    });
  }
  function payment(c, r, amount = "100", extras = {}) {
    let p = store.savePayment(actor, null, {
      societyId: society.id,
      projectId: project.id,
      bankId: bank.id,
      paymentDate: "2026-04-03",
      valueDate: "2026-04-03",
      reference: "DEBIT-" + ++sequence,
      distributions: [{ claimId: c.id, amount }],
      allocations: [{ receiptId: r.id, amount }],
      ...extras,
    });
    p = store.addPaymentEvidence(actor, p.id, {
      ...proof,
      revision: p.revision,
    });
    return p;
  }
  function action(p, a, extras = {}) {
    return store.transitionPayment(actor, p.id, a, {
      revision: p.revision,
      confirm: true,
      ...extras,
    });
  }
  function ready(p) {
    return action(action(p, "submit"), "approve");
  }
  function post(p) {
    return action(ready(p), "post", {
      override: true,
      reason: "Separate debit checked against bank evidence",
    });
  }
  function reverse(p, kind = "payments", extras = {}) {
    return store.reverseFinancial(actor, kind, p.id, {
      revision: p.revision,
      confirm: true,
      date: "2026-04-04",
      reference: "RETURN-" + ++sequence,
      reason: "Bank confirmed the original entry was returned",
      ...extras,
    });
  }
  return {
    store,
    directory,
    society,
    project,
    bank,
    supplier,
    receipt,
    claim,
    payment,
    action,
    ready,
    post,
    reverse,
  };
}
test("instalments consume only posted funds, derive claim pending and preserve exact paise", (t) => {
  const f = fixture(t),
    r = f.receipt(),
    c = f.claim("550.55", f.supplier, {
      gst: "50",
      tds: "20.10",
      retention: "30.20",
      otherDeduction: "0.25",
    });
  assert.equal(c.net, 50000);
  let p = f.payment(c, r, "200.25");
  for (const state of ["Draft", "Submitted", "Approved"]) {
    assert.equal(p.status, state);
    assert.equal(f.store.receipt(r.id).available, 100000);
    assert.equal(f.store.claim(c.id).pending, 50000);
    assert.equal(f.store.bankBook()[0].balance, 110000);
    if (state === "Draft") p = f.action(p, "submit");
    else if (state === "Submitted") p = f.action(p, "approve");
  }
  p = f.action(p, "post");
  assert.equal(p.ref, "OUT-26-27-000001");
  assert.equal(f.store.receipt(r.id).available, 79975);
  assert.equal(f.store.claim(c.id).settlement, "Part paid");
  const second = f.post(f.payment(c, r, "299.75"));
  assert.equal(second.ref, "OUT-26-27-000002");
  assert.equal(f.store.claim(c.id).pending, 0);
  assert.equal(f.store.claim(c.id).settlement, "Fully paid");
  assert.equal(f.store.bankBook()[0].balance, 60000);
  assert.throws(() => f.post(f.payment(c, r, "1")), /remaining claim/);
  assert.throws(() => f.action(p, "post"), /state/);
  assert.throws(
    () =>
      f.store.db
        .prepare("UPDATE payments SET status='Draft' WHERE id=?")
        .run(p.id),
    /immutable/,
  );
});
test("split receipt funding and labour batches create one bank debit with many beneficiary rows", (t) => {
  const f = fixture(t),
    r1 = f.receipt("200"),
    r2 = f.receipt("300");
  const worker = (name) =>
    f.store.save(actor, "beneficiaries", null, {
      name,
      societyId: f.society.id,
      category: "Individual labourer",
    });
  const details = {
    periodStart: "2026-04-01",
    periodEnd: "2026-04-02",
    certification: "Attendance register 1",
    quantity: "2",
    rate: "100",
  };
  const c1 = f.claim("200", worker("Worker one"), details),
    c2 = f.claim("300", worker("Worker two"), details);
  const p = f.post(
    f.payment(c1, r1, "200", {
      batch: true,
      distributions: [
        { claimId: c1.id, amount: "200" },
        { claimId: c2.id, amount: "300" },
      ],
      allocations: [
        { receiptId: r1.id, amount: "200" },
        { receiptId: r2.id, amount: "300" },
      ],
    }),
  );
  assert.equal(p.amount, 50000);
  assert.equal(
    f.store.bankBook()[0].entries.filter((e) => e.event === "Payment").length,
    1,
  );
  assert.equal(f.store.bankBook()[0].balance, 10000);
  assert.equal(f.store.receipt(r1.id).utilisation, "Fully utilised");
  assert.equal(f.store.receipt(r2.id).available, 0);
  assert.equal(f.store.claim(c2.id).pending, 0);
  f.reverse(p);
  assert.equal(f.store.receipt(r1.id).available, 20000);
  assert.equal(f.store.claim(c2.id).pending, 30000);
  assert.equal(f.store.bankBook()[0].balance, 60000);
});
test("two connections cannot overspend receipts; posting rollback leaves no allocations or used ID", (t) => {
  const f = fixture(t),
    r = f.receipt("100"),
    c = f.claim("200"),
    a = f.ready(f.payment(c, r, "80")),
    b = f.ready(f.payment(c, r, "80"));
  f.store.db.exec(
    "CREATE TRIGGER test_fail BEFORE INSERT ON allocations BEGIN SELECT RAISE(ABORT,'Injected failure'); END;",
  );
  assert.throws(() => f.action(a, "post"), /Injected failure/);
  assert.equal(f.store.payment(a.id).status, "Approved");
  assert.equal(
    f.store.db.prepare("SELECT COUNT(*) n FROM distributions").get().n,
    0,
  );
  f.store.db.exec("DROP TRIGGER test_fail");
  const second = new Store(f.directory);
  try {
    const posted = f.action(a, "post");
    assert.equal(posted.ref, "OUT-26-27-000001");
    assert.throws(
      () =>
        second.transitionPayment(actor, b.id, "post", {
          revision: b.revision,
          confirm: true,
        }),
      /available receipt/,
    );
    assert.equal(second.receipt(r.id).available, 2000);
    assert.equal(second.claim(c.id).pending, 12000);
  } finally {
    second.close();
  }
});
test("payment and receipt reversals preserve originals, release funds once and link corrections", (t) => {
  const f = fixture(t),
    r = f.receipt(),
    c = f.claim(),
    p = f.post(f.payment(c, r, "100"));
  assert.throws(() => f.reverse(r, "receipts"), /linked payments/);
  const failed = f.reverse(p, "payments", { outcome: "Failed" });
  assert.equal(failed.status, "Failed");
  assert.equal(f.store.receipt(r.id).allocations.length, 0);
  assert.equal(f.store.receipt(r.id).allocationHistory[0].status, "Failed");
  assert.equal(f.store.claim(c.id).paymentHistory[0].payment_id, p.id);
  assert.equal(f.store.claim(c.id).paymentHistory[0].status, "Failed");
  assert.equal(f.store.claim(c.id).pending, 100000);
  assert.throws(() => f.reverse(p), /unreversed/);
  assert.throws(
    () => f.payment(c, r, "100", { paymentDate: "2026-04-03" }),
    /released funding/,
  );
  assert.throws(
    () => f.reverse(r, "receipts", { date: "2026-04-03" }),
    /released funding/,
  );
  const corrected = f.post(
    f.payment(c, r, "100", {
      paymentDate: "2026-04-05",
      valueDate: "2026-04-05",
      correctionOf: p.id,
    }),
  );
  assert.equal(corrected.correctionOf, p.id);
  assert.notEqual(corrected.ref, p.ref);
  f.reverse(corrected, "payments", { date: "2026-04-06" });
  const reversed = f.reverse(r, "receipts", { date: "2026-04-07" });
  assert.equal(reversed.status, "Reversed");
  assert.equal(reversed.available, 0);
  assert.equal(f.store.bankBook()[0].balance, 10000);
  assert.equal(
    f.store.db.prepare("SELECT status FROM receipts WHERE id=?").get(r.id)
      .status,
    "Posted",
  );
  assert.equal(
    f.store.db.prepare("SELECT status FROM payments WHERE id=?").get(p.id)
      .status,
    "Posted",
  );
  assert.throws(
    () => f.store.db.exec("DELETE FROM reversals"),
    /cannot be deleted/,
  );
});
test("state, evidence, duplicate, scope, amount and backdating controls reject invalid operations", (t) => {
  const f = fixture(t),
    r = f.receipt(),
    c = f.claim(),
    p = f.payment(c, r);
  assert.throws(() => f.action(p, "post"), /state/);
  assert.throws(
    () =>
      f.store.transitionPayment(actor, p.id, "submit", {
        revision: p.revision,
      }),
    /confirmation/,
  );
  const submitted = f.action(p, "submit");
  assert.throws(() => f.action(p, "submit"), /changed/);
  assert.throws(
    () =>
      f.store.addPaymentEvidence(actor, p.id, {
        ...proof,
        revision: submitted.revision,
      }),
    /draft/,
  );
  const returned = f.action(submitted, "return", {
    reason: "Correct the bank reference before approval",
  });
  assert.equal(returned.status, "Draft");
  const cancelled = f.action(returned, "cancel", {
    reason: "Payment instruction was cancelled before debit",
  });
  assert.equal(cancelled.status, "Cancelled");
  assert.equal(f.store.receipt(r.id).available, 100000);
  const one = f.post(f.payment(c, r, "100", { reference: "SAME" }));
  const duplicate = f.ready(f.payment(c, r, "100", { reference: "same" }));
  assert.throws(() => f.action(duplicate, "post"), /already been posted/);
  assert.throws(
    () =>
      f.payment(c, r, "100", {
        allocations: [{ receiptId: r.id, amount: "99" }],
      }),
    /equal/,
  );
  assert.throws(
    () => f.payment(c, r, "100", { paymentDate: "2026-04-01" }),
    /precede/,
  );
  assert.throws(() => f.payment(c, r, "100", { batch: true }), /labour claims/);
  assert.throws(
    () =>
      f.payment(c, r, "100", {
        distributions: [
          { claimId: c.id, amount: "50" },
          { claimId: c.id, amount: "50" },
        ],
      }),
    /repeated/,
  );
  assert.throws(
    () => f.reverse(one, "payments", { reason: "short" }),
    /10 characters/,
  );
  assert.throws(
    () => f.reverse(one, "payments", { date: "2026-04-01" }),
    /precede/,
  );
});
test("claim approval validates category data and prevents duplicate claims or rewriting approved terms", (t) => {
  const f = fixture(t),
    c = f.claim();
  const raw = {
    ...c,
    gross: "1000",
    gst: "0",
    tds: "0",
    retention: "0",
    otherDeduction: "0",
  };
  assert.throws(() => f.store.saveClaim(actor, null, raw), /already exists/);
  assert.throws(() => f.store.saveClaim(actor, c.id, raw), /draft/);
  const noDate = f.store.saveClaim(actor, null, {
    ...raw,
    reference: "NEW",
    invoiceDate: "",
  });
  assert.throws(
    () =>
      f.store.transitionClaim(actor, noDate.id, "approve", {
        revision: noDate.revision,
        confirm: true,
      }),
    /invoice date/,
  );
  const r = f.receipt(),
    p = f.post(f.payment(c, r));
  assert.throws(
    () =>
      f.store.transitionClaim(actor, c.id, "cancel", {
        revision: c.revision,
        confirm: true,
        reason: "Cancel after incorrect claim entry",
      }),
    /Reverse/,
  );
  f.reverse(p);
  const cancelled = f.store.transitionClaim(actor, c.id, "cancel", {
    revision: c.revision,
    confirm: true,
    reason: "Incorrect claim replaced after returned payment",
  });
  assert.equal(cancelled.status, "Cancelled");
  assert.equal(cancelled.pending, 0);
});
test("version 2 upgrade preserves encrypted receipts, master IDs and audit history", (t) => {
  const f = fixture(t),
    r = f.receipt("100");
  const previous = f.store.db
    .prepare("SELECT payload FROM receipts WHERE id=?")
    .get(r.id).payload;
  const auditCount = f.store.db.prepare("SELECT count(*) n FROM audit").get().n;
  // Remove only empty Phase 3 tables in this test-created temporary database.
  f.store.db.exec(
    "DROP TABLE payment_evidence; DROP TABLE distributions; DROP TABLE allocations; DROP TABLE reversals; DROP TABLE payments; DROP TABLE claims; PRAGMA user_version=2;",
  );
  const upgraded = new Store(f.directory);
  try {
    assert.equal(
      upgraded.db.prepare("PRAGMA user_version").get().user_version,
      3,
    );
    assert.equal(upgraded.receipt(r.id).paymentId, r.paymentId);
    assert.equal(
      upgraded.db.prepare("SELECT payload FROM receipts WHERE id=?").get(r.id)
        .payload,
      previous,
    );
    assert.equal(
      upgraded.db.prepare("SELECT count(*) n FROM audit").get().n,
      auditCount,
    );
    assert.equal(upgraded.bankBook()[0].balance, 20000);
    assert.equal(upgraded.claims().length, 0);
  } finally {
    upgraded.close();
  }
});
test("same-day ledger order follows posting history even when timestamps tie", (t) => {
  t.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2026-04-05T00:00:00Z"),
  });
  const f = fixture(t),
    r = f.receipt("100"),
    c = f.claim("100");
  const first = f.post(f.payment(c, r, "100", { paymentDate: "2026-04-03" }));
  f.reverse(first, "payments", { date: "2026-04-03" });
  f.post(f.payment(c, r, "100", { paymentDate: "2026-04-03" }));
  assert.deepEqual(
    f.store.bankBook()[0].entries.map((e) => e.event),
    ["Receipt", "Payment", "Reversed", "Payment"],
  );
  assert.deepEqual(
    f.store.bankBook()[0].entries.map((e) => e.balance),
    [20000, 10000, 20000, 10000],
  );
});
test("cross-project and cross-account receipt funding is blocked", (t) => {
  const f = fixture(t),
    r = f.receipt(),
    c = f.claim();
  const bank = f.store.save(actor, "banks", null, {
    name: "Other bank",
    societyId: f.society.id,
    bankName: "Bank",
    accountNumber: "987654321",
    ifsc: "SBIN0001234",
    accountType: "Current",
    openingDate: "2026-04-01",
    openingBalance: "1000",
  });
  assert.throws(
    () => f.payment(c, r, "100", { bankId: bank.id }),
    /same Society, project and bank/,
  );
  const existing = f.store.detail(actor, "projects", f.project.id, true);
  const project = f.store.save(actor, "projects", null, {
    ...existing,
    name: "Other project",
    workOrder: "WO-2",
    contractValue: "10000",
    workingPercent: "0",
  });
  assert.throws(
    () => f.payment(c, r, "100", { projectId: project.id }),
    /claims from this Society and project/,
  );
});
test("HTTP concurrent tabs recheck allocation and expose only local attachment downloads", async (t) => {
  const f = fixture(t),
    r = f.receipt("100"),
    c = f.claim("200"),
    a = f.ready(f.payment(c, r, "80")),
    b = f.ready(f.payment(c, r, "80"));
  const server = createApp(f.store);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const post = (p) =>
    fetch(`${origin}/api/payments/${p.id}/post`, {
      method: "POST",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        "X-FundTrace-Local": "1",
      },
      body: JSON.stringify({ revision: p.revision, confirm: true }),
    });
  const responses = await Promise.all([post(a), post(b)]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
  assert.equal(f.store.receipt(r.id).available, 2000);
  const download = await fetch(
    `${origin}/api/payments/${a.id}/evidence/${a.evidence[0].id}`,
  );
  assert.equal(download.status, 200);
  assert.match(download.headers.get("content-disposition"), /attachment/);
  assert.equal(
    (await fetch(`${origin}/api/payments/${b.id}/evidence/${a.evidence[0].id}`))
      .status,
    404,
  );
  const reopened = new Store(f.directory);
  try {
    assert.equal(reopened.bankBook()[0].balance, 12000);
    assert.equal(
      reopened.db.prepare("PRAGMA user_version").get().user_version,
      3,
    );
  } finally {
    reopened.close();
  }
});
