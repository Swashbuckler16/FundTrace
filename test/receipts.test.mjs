import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { Store, LOCAL_ACTOR as actor } from "../src/store.mjs";
import { createApp } from "../src/server.mjs";

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), "fundtrace-receipts-"));
  const store = new Store(directory);
  t.after(() => {
    store.close();
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    rmSync(directory, { recursive: true, force: true });
  });
  const society = store.save(actor, "societies", null, {
    name: "Test society",
    code: "TS",
    effectiveDate: "2026-04-01",
  });
  const department = store.save(actor, "departments", null, {
    name: "Test department",
  });
  const project = store.save(actor, "projects", null, {
    name: "Test project",
    societyId: society.id,
    departmentId: department.id,
    workOrder: "WO1",
    workOrderDate: "2026-04-01",
    contractValue: "1000",
    projectStatus: "In Progress",
  });
  const bankRaw = {
    name: "Test bank",
    societyId: society.id,
    bankName: "Bank",
    accountNumber: "123456789",
    ifsc: "SBIN0001234",
    accountType: "Current",
    openingBalance: "100.50",
    openingDate: "2026-04-01",
  };
  const bank = store.save(actor, "banks", null, bankRaw);
  const raw = {
    societyId: society.id,
    departmentId: department.id,
    projectId: project.id,
    bankId: bank.id,
    creditDate: "2026-05-01",
    valueDate: "2026-05-02",
    amount: "200.25",
    reference: "UTR1",
    grossBill: "250",
    gstDeduction: "25",
    taxCredit: "24.75",
  };
  const evidence = (draft) =>
    store.addEvidence(actor, draft.id, {
      revision: draft.revision,
      name: "advice.pdf",
      data: Buffer.from("%PDF-1.4\nTest evidence").toString("base64"),
    });
  const draft = (changes = {}) =>
    evidence(store.saveReceipt(actor, null, { ...raw, ...changes }));
  const post = (draft) =>
    store.postReceipt(actor, draft.id, {
      revision: draft.revision,
      confirm: true,
    });
  return {
    store,
    directory,
    society,
    department,
    project,
    bank,
    bankRaw,
    raw,
    evidence,
    draft,
    post,
  };
}
test("drafts create no cash; posting atomically assigns a credit-FY ID and only actual bank cash", (t) => {
  const f = fixture(t),
    draft = f.draft();
  assert.equal(draft.paymentId, null);
  assert.equal(draft.available, 0);
  assert.equal(f.store.bankBook(actor)[0].balance, 10050);
  const posted = f.post(draft);
  assert.equal(posted.paymentId, "LSP-TS-26-27-000001");
  assert.equal(posted.available, 20025);
  assert.equal(f.store.bankBook(actor)[0].balance, 30075);
  assert.equal(f.store.bankBook(actor)[0].entries.length, 1);
  assert.throws(() => f.post(draft), /already been posted/);
  assert.throws(
    () =>
      f.store.saveReceipt(actor, draft.id, {
        ...f.raw,
        revision: posted.revision,
      }),
    /cannot be edited/,
  );
  assert.throws(() => f.store.addEvidence(actor, draft.id, {}), /locked/);
  assert.throws(
    () => f.store.db.exec("UPDATE bank_entries SET amount=1"),
    /immutable/,
  );
  assert.throws(
    () =>
      f.store.save(actor, "banks", f.bank.id, {
        ...f.bankRaw,
        openingBalance: "999",
        revision: 1,
        reason: "Attempt to rewrite opening",
      }),
    /locked/,
  );
});
test("incomplete drafts persist; posting checks evidence, dates, amount, reference, scope and revision", (t) => {
  const f = fixture(t);
  const incomplete = f.store.saveReceipt(actor, null, {
    societyId: f.society.id,
  });
  assert.throws(() => f.post(incomplete), /active/);
  const noEvidence = f.store.saveReceipt(actor, null, f.raw);
  assert.throws(() => f.post(noEvidence), /evidence/);
  const attached = f.evidence(noEvidence);
  assert.throws(() => f.post(noEvidence), /changed/);
  for (const changes of [
    { amount: "0" },
    { creditDate: "" },
    { valueDate: "" },
    { reference: "" },
  ])
    assert.throws(() => f.post(f.draft(changes)));
  const other = f.store.save(actor, "societies", null, {
    name: "Other",
    code: "OT",
    effectiveDate: "2026-04-01",
  });
  assert.throws(
    () => f.store.saveReceipt(actor, null, { ...f.raw, societyId: other.id }),
    /belong/,
  );
  assert.throws(
    () =>
      f.store.saveReceipt(actor, null, { ...f.raw, creditDate: "2026-03-31" }),
    /opening/,
  );
  assert.throws(
    () =>
      f.store.postReceipt(actor, attached.id, { revision: attached.revision }),
    /Confirm/,
  );
  assert.equal(f.store.bankBook(actor)[0].entries.length, 0);
  assert.equal(
    f.store.db
      .prepare("SELECT count(*) AS n FROM series WHERE key LIKE 'receipt:%'")
      .get().n,
    0,
  );
});
test("duplicate controls recheck at posting and require explicit documented override", (t) => {
  const f = fixture(t),
    first = f.draft(),
    second = f.draft();
  f.post(first);
  assert.equal(f.store.receipt(second.id).duplicates.length, 1);
  assert.throws(() => f.post(second), /duplicate/);
  assert.throws(
    () =>
      f.store.postReceipt(actor, second.id, {
        revision: second.revision,
        confirm: true,
        duplicateReason: "Separate credit, verified",
      }),
    /duplicate/,
  );
  const posted = f.store.postReceipt(actor, second.id, {
    revision: second.revision,
    confirm: true,
    override: true,
    duplicateReason: "Separate bank credit verified against advice",
  });
  assert.equal(posted.paymentId, "LSP-TS-26-27-000002");
  assert.match(f.store.auditList(actor, second.id)[0].reason, /Separate bank/);
  assert.equal(f.store.bankBook(actor)[0].balance, 50100);
});
test("posting failure rolls back ID, ledger and state; second connection cannot double post", (t) => {
  const f = fixture(t),
    draft = f.draft();
  f.store.db.exec(
    "CREATE TRIGGER test_failure BEFORE INSERT ON bank_entries BEGIN SELECT RAISE(ABORT,'Test failure'); END;",
  );
  assert.throws(() => f.post(draft), /Test failure/);
  assert.equal(f.store.receipt(draft.id).status, "Draft");
  assert.equal(
    f.store.db
      .prepare("SELECT count(*) AS n FROM series WHERE key LIKE 'receipt:%'")
      .get().n,
    0,
  );
  f.store.db.exec("DROP TRIGGER test_failure");
  const second = new Store(f.directory);
  try {
    const posted = f.post(draft);
    assert.throws(
      () =>
        second.postReceipt(actor, draft.id, {
          revision: draft.revision,
          confirm: true,
        }),
      /already/,
    );
    assert.equal(second.receipt(draft.id).paymentId, posted.paymentId);
    assert.equal(second.bankBook(actor)[0].entries.length, 1);
    assert.equal(
      second.db.prepare("PRAGMA user_version").get().user_version,
      3,
    );
  } finally {
    second.close();
  }
});
test("local evidence uses bounded encrypted storage, safe names and supported signatures", (t) => {
  const f = fixture(t),
    draft = f.store.saveReceipt(actor, null, f.raw);
  for (const raw of [
    { name: "../bad.pdf", data: "QQ==" },
    {
      name: "script.html",
      data: Buffer.from("<script>alert(1)</script>").toString("base64"),
    },
    {
      name: "large.pdf",
      data: Buffer.alloc(2 * 1024 * 1024 + 1).toString("base64"),
    },
  ])
    assert.throws(() =>
      f.store.addEvidence(actor, draft.id, {
        ...raw,
        revision: draft.revision,
      }),
    );
  const attached = f.evidence(draft),
    file = f.store.evidenceFile(draft.id, attached.evidence[0].id);
  assert.equal(
    Buffer.from(file.data, "base64").toString(),
    "%PDF-1.4\nTest evidence",
  );
  assert(!JSON.stringify(attached).includes("JVBER"));
  assert.throws(
    () => f.store.evidenceFile("another-receipt", attached.evidence[0].id),
    /not found/,
  );
  f.store.db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
  assert(
    !readFileSync(join(f.directory, "fundtrace.sqlite")).includes(
      Buffer.from("Test evidence"),
    ),
  );
});
test("receipt HTTP workflow serves downloadable evidence and persists posted ledger on reopen", async (t) => {
  const f = fixture(t),
    server = createApp(f.store);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const request = (path, body, method = "POST") =>
    fetch(origin + "/api" + path, {
      method,
      headers: {
        Origin: origin,
        "X-FundTrace-Local": "1",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  const draft = await (await request("/receipts", f.raw)).json();
  const attached = await (
    await request(`/receipts/${draft.id}/evidence`, {
      name: "advice.pdf",
      data: Buffer.from("%PDF-1.4\nEvidence").toString("base64"),
      revision: draft.revision,
    })
  ).json();
  const file = await fetch(
    `${origin}/api/receipts/${draft.id}/evidence/${attached.evidence[0].id}`,
  );
  assert.equal(file.status, 200);
  assert.match(file.headers.get("content-disposition"), /^attachment/);
  assert.match(await file.text(), /%PDF/);
  assert.equal(
    (
      await request(`/receipts/${draft.id}/post`, {
        revision: attached.revision,
        confirm: true,
      })
    ).status,
    200,
  );
  const reopened = new Store(f.directory);
  try {
    assert.equal(reopened.bankBook(actor)[0].balance, 30075);
  } finally {
    reopened.close();
  }
});
