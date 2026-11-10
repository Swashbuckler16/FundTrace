import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store, LOCAL_ACTOR as actor } from "../src/store.mjs";
import { calculateTax } from "../src/tax.mjs";

const evidence = {
  name: "certificate.pdf",
  data: Buffer.from("%PDF-1.4\nEvidence").toString("base64"),
};
const confirmation = {
  confirm: true,
  reason: "Checked against original bank evidence",
};

test("version 3 migration preserves existing receipt ciphertext, cash and audit history", (t) => {
  const f = fixture(t),
    receipt = f.receipt();
  const payload = f.store.db
    .prepare("SELECT payload FROM receipts WHERE id=?")
    .get(receipt.id).payload;
  const auditCount = f.store.db.prepare("SELECT count(*) n FROM audit").get().n;
  // Only empty Phase 4 tables in this test-created database are removed.
  f.store.db.exec(
    "DROP TABLE tax_evidence; DROP TABLE tax_events; DROP TABLE tax_records; DROP TABLE tax_rules; DROP TABLE period_locks; DROP TABLE bank_movements; DROP TABLE reconciliation_exceptions; DROP TABLE reconciliation_links; DROP TABLE statement_lines; DROP TABLE statement_imports; PRAGMA user_version=3;",
  );
  const upgraded = new Store(f.directory);
  try {
    assert.equal(
      upgraded.db.prepare("PRAGMA user_version").get().user_version,
      4,
    );
    assert.equal(
      upgraded.db
        .prepare("SELECT payload FROM receipts WHERE id=?")
        .get(receipt.id).payload,
      payload,
    );
    assert.equal(
      upgraded.db.prepare("SELECT count(*) n FROM audit").get().n,
      auditCount,
    );
    assert.equal(upgraded.bankBook()[0].balance, 110000);
    assert.equal(upgraded.receipt(receipt.id).paymentId, receipt.paymentId);
  } finally {
    upgraded.close();
  }
});
function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), "fundtrace-phase4-"));
  const store = new Store(directory);
  t.after(() => {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  });
  const society = store.save(actor, "societies", null, {
    name: "Society",
    code: "SS",
    effectiveDate: "2026-04-01",
  });
  const department = store.save(actor, "departments", null, {
    name: "Department",
  });
  const project = store.save(actor, "projects", null, {
    name: "Project",
    societyId: society.id,
    departmentId: department.id,
    workOrder: "WO",
    workOrderDate: "2026-04-01",
    contractValue: "10000",
    projectStatus: "In Progress",
  });
  const bank = store.save(actor, "banks", null, {
    name: "Account",
    societyId: society.id,
    bankName: "Bank",
    accountNumber: "123456789",
    ifsc: "SBIN0001234",
    accountType: "Current",
    openingBalance: "100",
    openingDate: "2026-04-01",
  });
  const receipt = (
    amount = "1000",
    reference = "UTR1",
    creditDate = "2026-04-02",
  ) => {
    let r = store.saveReceipt(actor, null, {
      societyId: society.id,
      departmentId: department.id,
      projectId: project.id,
      bankId: bank.id,
      creditDate,
      valueDate: creditDate,
      amount,
      reference,
    });
    r = store.addEvidence(actor, r.id, { ...evidence, revision: r.revision });
    return store.postReceipt(actor, r.id, {
      ...confirmation,
      revision: r.revision,
    });
  };
  const statement = (extra = {}) => ({
    ...confirmation,
    bankId: bank.id,
    start: "2026-04-01",
    end: "2026-04-30",
    opening: "100",
    closing: "1100",
    sourceName: "statement.csv",
    sourceData: Buffer.from("Date,Credit\n2026-04-02,1000").toString("base64"),
    rows: [
      {
        date: "2026-04-02",
        credit: "1000",
        reference: "UTR1",
        balance: "1100",
      },
    ],
    ...extra,
  });
  const rule = () =>
    store.saveTaxRule(actor, {
      ...confirmation,
      societyId: society.id,
      taxType: "Confirmed treatment",
      rate: "2",
      effectiveFrom: "2026-04-01",
      basis: "Accountant confirmed base",
      evidenceReference: "Accountant memo 1",
    });
  return { store, directory, society, project, bank, receipt, statement, rule };
}

test("statement preview is read-only; import validates balances, duplicates and immutable source", (t) => {
  const f = fixture(t),
    s = f.store;
  assert.equal(s.previewStatement(f.statement()).duplicates, 0);
  assert.equal(s.statementImports().length, 0);
  for (const change of [
    { opening: "" },
    { closing: "999" },
    {
      rows: [{ date: "2026-04-02", debit: "1", credit: "1", reference: "bad" }],
    },
  ])
    assert.throws(() => s.importStatement(actor, f.statement(change)));
  const imported = s.importStatement(actor, f.statement());
  assert.equal(s.statementSource(imported.id).data, f.statement().sourceData);
  assert.equal(s.previewStatement(f.statement()).duplicates, 1);
  const corrected = f.statement({
    rows: [
      {
        date: "2026-04-02",
        credit: "1000",
        reference: "Changed reference",
        balance: "1100",
      },
    ],
  });
  assert.equal(s.previewStatement(corrected).duplicates, 0);
  assert.equal(s.previewStatement(corrected).overlaps, true);
  assert.throws(() => s.importStatement(actor, corrected), /overlaps/);
  assert.equal(s.statementImports().length, 1);
  assert.throws(() => s.importStatement(actor, f.statement()), /overlaps/);
  assert.throws(
    () =>
      s.db
        .prepare("DELETE FROM statement_lines WHERE id=?")
        .run(imported.lines[0].id),
    /immutable/,
  );
  assert.equal(s.bankBook()[0].balance, 10000);
});

test("partial and grouped matching enforce capacities across connections and retain removed links", (t) => {
  const f = fixture(t),
    s = f.store,
    r = f.receipt("600"),
    r2 = f.receipt("400", "UTR2");
  const line = s.importStatement(actor, f.statement()).lines[0];
  const match = (id, amount) => ({ movementKey: `receipt:${id}`, amount });
  assert.equal(
    s.matchStatement(actor, line.id, {
      ...confirmation,
      matches: [match(r.id, "300")],
    }).remaining,
    70000,
  );
  const second = new Store(f.directory);
  try {
    assert.throws(
      () =>
        second.matchStatement(actor, line.id, {
          ...confirmation,
          matches: [match(r.id, "301")],
        }),
      /exceeds/,
    );
  } finally {
    second.close();
  }
  assert.throws(
    () =>
      s.matchStatement(actor, line.id, {
        confirm: true,
        matches: [match(r2.id, "400")],
      }),
    /Reason/,
  );
  let done = s.matchStatement(actor, line.id, {
    ...confirmation,
    matches: [match(r.id, "300"), match(r2.id, "400")],
  });
  assert.equal(done.status, "Matched");
  done = s.unmatchStatement(actor, done.links[0].id, confirmation);
  assert.equal(done.remaining, 30000);
  assert.equal(
    s.db.prepare("SELECT count(*) n FROM reconciliation_links").get().n,
    3,
  );
  assert.equal(s.receipt(r.id).available, 60000);
});

test("charges and their reversals change bank cash but never create receipt funding", (t) => {
  const f = fixture(t),
    s = f.store,
    r = f.receipt();
  const raw = {
    ...confirmation,
    bankId: f.bank.id,
    date: "2026-04-03",
    category: "Bank charge",
    amount: "10",
    reference: "CHARGE1",
  };
  const charge = s.saveBankMovement(actor, raw);
  assert.equal(s.bankBook()[0].balance, 109000);
  assert.equal(s.receipt(r.id).available, 100000);
  assert.throws(() => s.saveBankMovement(actor, raw), /already exists/);
  s.saveBankMovement(actor, {
    ...raw,
    category: "Other credit",
    reference: "CORRECTION1",
    reversalOf: charge.id,
  });
  assert.equal(s.bankBook()[0].balance, 110000);
  assert.throws(
    () =>
      s.saveBankMovement(actor, {
        ...raw,
        category: "Other credit",
        reference: "CORRECTION2",
        reversalOf: charge.id,
      }),
    /already reversed/,
  );
});

test("exceptions block locking; locks protect earlier cash and tax until reasoned reopen", (t) => {
  const f = fixture(t),
    s = f.store,
    r = f.receipt();
  const line = s.importStatement(actor, f.statement()).lines[0];
  const period = {
    ...confirmation,
    bankId: f.bank.id,
    start: "2026-04-01",
    end: "2026-04-30",
  };
  assert.throws(() => s.lockPeriod(actor, period), /fully match/);
  s.matchStatement(actor, line.id, {
    ...confirmation,
    matches: [{ movementKey: `receipt:${r.id}`, amount: "1000" }],
  });
  let exception = s.saveException(actor, line.id, {
    ...confirmation,
    owner: "Accountant",
    status: "Open",
  }).exceptions[0];
  assert.throws(() => s.lockPeriod(actor, period), /exceptions/);
  s.saveException(actor, line.id, {
    ...confirmation,
    id: exception.id,
    revision: exception.revision,
    owner: "Accountant",
    status: "Resolved",
  });
  const locked = s.lockPeriod(actor, period);
  assert.throws(() => f.receipt("1", "LATE"), /locked/);
  assert.throws(() => f.rule(), /locked/);
  assert.throws(() => s.importStatement(actor, f.statement()), /locked/);
  assert.throws(
    () =>
      s.unmatchStatement(
        actor,
        s.statementLine(line.id).links[0].id,
        confirmation,
      ),
    /locked/,
  );
  assert.throws(
    () =>
      s.reopenPeriod(actor, locked.id, {
        ...confirmation,
        reason: "short",
        revision: locked.revision,
      }),
    /10 characters/,
  );
  s.reopenPeriod(actor, locked.id, {
    ...confirmation,
    revision: locked.revision,
  });
  assert.equal(f.receipt("1", "LATE").amount, 100);
  assert.equal(s.periods()[0].status, "Reopened");
});

test("tax credits, set-offs and documented adjustments remain separate from cash and funding", (t) => {
  const f = fixture(t),
    s = f.store,
    r = f.receipt(),
    rule = f.rule();
  const raw = {
    ...confirmation,
    societyId: f.society.id,
    projectId: f.project.id,
    receiptId: r.id,
    ruleId: rule.id,
    date: "2026-04-02",
    reference: "CERT1",
    base: "1000",
    deducted: "20",
    bankAmount: "1000",
    evidence,
  };
  const tax = s.saveTaxRecord(actor, raw);
  assert.equal(tax.expected, 2000);
  assert.throws(
    () =>
      s.saveTaxRecord(actor, {
        ...raw,
        reference: "CERT2",
        expected: "30",
        reason: "",
      }),
    /Reason/,
  );
  const event = (kind, amount, reference) =>
    s.addTaxEvent(actor, tax.id, {
      ...confirmation,
      kind,
      amount,
      reference,
      date: "2026-04-03",
      evidence,
    });
  assert.throws(() => event("Credit", "21", "C0"), /exceeds/);
  event("Credit", "20", "C1");
  assert.throws(() => event("Set-off", "21", "S0"), /exceeds/);
  assert.equal(event("Set-off", "5", "S1").available, 1500);
  assert.throws(() => event("Adjustment decrease", "16", "A0"), /exceeds/);
  assert.equal(event("Adjustment increase", "1", "A1").available, 1600);
  assert.equal(s.bankBook()[0].balance, 110000);
  assert.equal(s.receipt(r.id).available, 100000);
  assert.equal(s.taxEvidence(tax.id, tax.evidence[0].id).data, evidence.data);
  assert.throws(
    () => s.db.prepare("DELETE FROM tax_records WHERE id=?").run(tax.id),
    /immutable/,
  );
});

test("effective tax versions and exact half-up rounding survive restart", (t) => {
  const f = fixture(t),
    s = f.store,
    rule = f.rule();
  assert.equal(calculateTax(25, 200), 1);
  assert.equal(calculateTax(24, 200), 0);
  assert.throws(() => f.rule(), /later effective date/);
  const later = s.saveTaxRule(actor, {
    ...confirmation,
    societyId: f.society.id,
    taxType: rule.taxType,
    rate: "3",
    effectiveFrom: "2026-05-01",
    basis: "New confirmed basis",
    evidenceReference: "Memo2",
  });
  const raw = {
    ...confirmation,
    societyId: f.society.id,
    projectId: f.project.id,
    ruleId: rule.id,
    date: "2026-05-02",
    reference: "C",
    base: "1000",
    evidence,
  };
  assert.throws(() => s.saveTaxRecord(actor, raw), /latest treatment/);
  const record = s.saveTaxRecord(actor, { ...raw, ruleId: later.id });
  const reopened = new Store(f.directory);
  try {
    assert.equal(reopened.taxRecord(record.id).expected, 3000);
    assert.equal(
      reopened.db.prepare("PRAGMA user_version").get().user_version,
      4,
    );
  } finally {
    reopened.close();
  }
});
