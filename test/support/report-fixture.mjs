import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import assert from "node:assert/strict";
import { Store, LOCAL_ACTOR as actor } from "../../src/store.mjs";
export { actor };
export function reportFixture() {
  const directory = mkdtempSync(join(tmpdir(), "fundtrace-reports-")),
    store = new Store(directory);
  const proof = {
    name: "bank.pdf",
    data: Buffer.from("%PDF-1.4\nTest evidence").toString("base64"),
  };
  const society = store.save(actor, "societies", null, {
    name: "Report Society",
    code: "RPT",
    effectiveDate: "2026-04-01",
  });
  const department = store.save(actor, "departments", null, { name: "PWD" });
  const project = store.save(actor, "projects", null, {
    name: "Bridge works",
    societyId: society.id,
    departmentId: department.id,
    workOrder: "WO-REPORT",
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
    name: "Test Supplier",
    societyId: society.id,
    category: "Supplier",
    phone: "9876543210",
  });
  let sequence = 0;
  const receipt = (amount = "1000", day = "2026-04-02", extras = {}) => {
    let r = store.saveReceipt(actor, null, {
      societyId: society.id,
      departmentId: department.id,
      projectId: project.id,
      bankId: bank.id,
      creditDate: day,
      valueDate: day,
      amount,
      reference: `CREDIT-${++sequence}`,
      billNumber: "=1+1",
      ...extras,
    });
    r = store.addEvidence(actor, r.id, { ...proof, revision: r.revision });
    return store.postReceipt(actor, r.id, {
      confirm: true,
      revision: r.revision,
      override: true,
      duplicateReason: "Separate receipt evidence checked",
    });
  };
  const claim = (amount = "800", beneficiary = supplier, extras = {}) => {
    let c = store.saveClaim(actor, null, {
      societyId: society.id,
      projectId: project.id,
      beneficiaryId: beneficiary.id,
      reference: `CLAIM-${++sequence}`,
      invoiceDate: "2026-04-02",
      gross: amount,
      ...extras,
    });
    return store.transitionClaim(actor, c.id, "approve", {
      confirm: true,
      revision: c.revision,
    });
  };
  const payment = (r, c, amount = "300", day = "2026-04-03", extras = {}) => {
    let p = store.savePayment(actor, null, {
      societyId: society.id,
      projectId: project.id,
      bankId: bank.id,
      paymentDate: day,
      valueDate: day,
      reference: `DEBIT-${++sequence}`,
      distributions: [{ claimId: c.id, amount }],
      allocations: [{ receiptId: r.id, amount }],
      ...extras,
    });
    p = store.addPaymentEvidence(actor, p.id, {
      ...proof,
      revision: p.revision,
    });
    for (const action of ["submit", "approve", "post"])
      p = store.transitionPayment(actor, p.id, action, {
        confirm: true,
        revision: p.revision,
        override: true,
        reason: "Separate bank debit evidence checked",
      });
    return p;
  };
  const r = receipt(),
    c = claim(),
    p = payment(r, c);
  const rule = store.saveTaxRule(actor, {
    confirm: true,
    societyId: society.id,
    taxType: "Confirmed treatment",
    rate: "2",
    effectiveFrom: "2026-04-01",
    basis: "Accountant approved bill base",
    evidenceReference: "MEMO1",
    reason: "Accountant treatment reviewed",
  });
  let tax = store.saveTaxRecord(actor, {
    confirm: true,
    societyId: society.id,
    projectId: project.id,
    receiptId: r.id,
    ruleId: rule.id,
    date: "2026-04-02",
    base: "1000",
    deducted: "20",
    reference: "CERT1",
    bankAmount: "1000",
    evidence: proof,
  });
  tax = store.addTaxEvent(actor, tax.id, {
    confirm: true,
    kind: "Credit",
    date: "2026-05-01",
    amount: "20",
    reference: "LEDGER1",
    reason: "Credit confirmed from ledger",
    evidence: proof,
  });
  const close = () => {
    store.close();
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    rmSync(directory, { recursive: true, force: true });
  };
  return {
    store,
    directory,
    society,
    department,
    project,
    bank,
    supplier,
    proof,
    receipt,
    claim,
    payment,
    r,
    c,
    p,
    tax,
    close,
  };
}
