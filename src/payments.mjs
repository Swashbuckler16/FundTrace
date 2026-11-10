import { randomUUID } from "node:crypto";
import { demand, text, date, money, financialYear } from "./domain.mjs";
import { encrypt, decrypt } from "./security.mjs";

export function initializePayments(store) {
  store.db.exec(`BEGIN IMMEDIATE;
    CREATE TABLE IF NOT EXISTS claims (id TEXT PRIMARY KEY, ref TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL, payload TEXT NOT NULL, revision INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, ref TEXT UNIQUE, status TEXT NOT NULL,
      payload TEXT NOT NULL, revision INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS distributions (payment_id TEXT REFERENCES payments(id), claim_id TEXT REFERENCES claims(id),
      amount INTEGER NOT NULL CHECK(amount>0), PRIMARY KEY(payment_id,claim_id));
    CREATE TABLE IF NOT EXISTS allocations (payment_id TEXT REFERENCES payments(id), receipt_id TEXT REFERENCES receipts(id),
      amount INTEGER NOT NULL CHECK(amount>0), PRIMARY KEY(payment_id,receipt_id));
    CREATE TABLE IF NOT EXISTS payment_evidence (id TEXT PRIMARY KEY, payment_id TEXT NOT NULL REFERENCES payments(id), payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS reversals (id TEXT PRIMARY KEY, kind TEXT NOT NULL, source_id TEXT NOT NULL,
      payload TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(kind,source_id));
    CREATE TRIGGER IF NOT EXISTS payment_posted_lock BEFORE UPDATE ON payments WHEN OLD.status='Posted'
      BEGIN SELECT RAISE(ABORT,'Posted payments are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS claim_approved_lock BEFORE UPDATE ON claims WHEN OLD.status='Approved' AND NEW.status!='Cancelled'
      BEGIN SELECT RAISE(ABORT,'Approved claims are immutable'); END;
    PRAGMA user_version=3; COMMIT;`);
  for (const table of [
    "claims",
    "payments",
    "distributions",
    "allocations",
    "reversals",
    "payment_evidence",
  ]) {
    store.db
      .exec(`CREATE TRIGGER IF NOT EXISTS ${table}_no_delete BEFORE DELETE ON ${table}
      BEGIN SELECT RAISE(ABORT,'Financial history cannot be deleted'); END;`);
    if (
      [
        "distributions",
        "allocations",
        "reversals",
        "payment_evidence",
      ].includes(table)
    )
      store.db
        .exec(`CREATE TRIGGER IF NOT EXISTS ${table}_no_update BEFORE UPDATE ON ${table}
        BEGIN SELECT RAISE(ABORT,'Financial history is immutable'); END;`);
  }
}
function read(store, row) {
  demand(row, "Record not found.", 404);
  return {
    ...decrypt(row.payload, store.key),
    id: row.id,
    ref: row.ref,
    status: row.status,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
function master(store, kind, id) {
  const row = store.db
    .prepare("SELECT * FROM records WHERE kind=? AND id=?")
    .get(kind, id);
  demand(row?.status === "Active", `Select an active ${kind} record.`);
  return store.readRecord(row, true);
}
function sameScope(store, data, bank = false) {
  master(store, "societies", data.societyId);
  const project = master(store, "projects", data.projectId);
  demand(
    project.societyId === data.societyId,
    "Project must belong to the selected Society.",
  );
  demand(
    project.projectStatus !== "Closed",
    "Closed projects cannot receive new claims or payments.",
  );
  if (bank)
    demand(
      master(store, "banks", data.bankId).societyId === data.societyId,
      "Bank account must belong to the selected Society.",
    );
}
function revision(record, raw) {
  demand(
    raw.revision === record.revision,
    "Record changed. Reload before continuing.",
    409,
  );
}
function confirm(raw) {
  demand(raw.confirm === true, "Explicit local confirmation is required.");
}
function reason(raw) {
  const value = text(raw.reason, "Reason", true, 1000);
  demand(value.length >= 10, "Reason must contain at least 10 characters.");
  return value;
}
function sum(rows) {
  const total = rows.reduce((n, r) => n + r.amount, 0);
  demand(
    Number.isSafeInteger(total),
    "Amount exceeds the supported monetary range.",
  );
  return total;
}
function lines(raw, key) {
  demand(
    Array.isArray(raw) && raw.length > 0 && raw.length <= 100,
    `Provide between 1 and 100 ${key} rows.`,
  );
  const rows = raw.map((r) => ({
    [key]: text(r?.[key], key, true),
    amount: money(r?.amount, "Row amount"),
  }));
  demand(
    rows.every((r) => r.amount > 0),
    "Every row amount must be positive.",
  );
  demand(
    new Set(rows.map((r) => r[key])).size === rows.length,
    "Combine repeated selections into one row.",
  );
  sum(rows);
  return rows;
}
export function evidencePayload(raw) {
  const name = text(raw.name, "File name", true, 160);
  demand(!/[\\/\x00-\x1f]/.test(name), "Use a plain file name.");
  demand(
    typeof raw.data === "string" &&
      raw.data.length <= 2800000 &&
      /^[A-Za-z0-9+/]*={0,2}$/.test(raw.data),
    "Invalid file encoding.",
  );
  const bytes = Buffer.from(raw.data, "base64");
  demand(
    bytes.length > 0 && bytes.length <= 2 * 1024 * 1024,
    "Evidence must be between 1 byte and 2 MB.",
  );
  const type =
    bytes.subarray(0, 5).toString() === "%PDF-"
      ? "application/pdf"
      : bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        ? "image/png"
        : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
          ? "image/jpeg"
          : "";
  demand(type, "Upload a PDF, PNG or JPEG evidence file.");
  return { name, type, size: bytes.length, data: bytes.toString("base64") };
}
export const paymentMethods = {
  nextFinancialRef(prefix, year = "") {
    const value = this.db
      .prepare(
        "INSERT INTO series VALUES(?,1) ON CONFLICT(key) DO UPDATE SET value=value+1 RETURNING value",
      )
      .get(`${prefix}:${year}`).value;
    return `${prefix}-${year ? year + "-" : ""}${String(value).padStart(6, "0")}`;
  },
  claims() {
    return this.db
      .prepare("SELECT * FROM claims ORDER BY created_at DESC")
      .all()
      .map((row) => this.claim(row.id));
  },
  claim(id) {
    const result = read(
      this,
      this.db.prepare("SELECT * FROM claims WHERE id=?").get(id),
    );
    result.paymentHistory = this.db
      .prepare(
        `SELECT d.payment_id,d.amount,p.ref,r.payload AS reversal_payload FROM distributions d JOIN payments p ON p.id=d.payment_id
        LEFT JOIN reversals r ON r.kind='payments' AND r.source_id=p.id WHERE d.claim_id=? ORDER BY p.created_at,p.id`,
      )
      .all(id)
      .map(({ reversal_payload, ...row }) => ({
        ...row,
        status: reversal_payload
          ? decrypt(reversal_payload, this.key).outcome
          : "Posted",
      }));
    result.payments = result.paymentHistory.filter(
      (p) => p.status === "Posted",
    );
    result.paid = sum(result.payments);
    result.pending =
      result.status === "Approved" ? result.net - result.paid : 0;
    result.settlement =
      result.status !== "Approved"
        ? result.status
        : result.paid === 0
          ? "Unpaid"
          : result.pending === 0
            ? "Fully paid"
            : "Part paid";
    return result;
  },
  saveClaim(actor, id, raw) {
    const data = {};
    for (const k of [
      "societyId",
      "projectId",
      "beneficiaryId",
      "reference",
      "description",
      "certification",
      "stage",
      "gstInvoice",
      "quantity",
      "rate",
    ])
      data[k] = text(
        raw[k],
        k,
        ["societyId", "projectId", "beneficiaryId", "reference"].includes(k),
        k === "description" ? 2000 : 240,
      );
    for (const k of ["invoiceDate", "periodStart", "periodEnd"])
      data[k] = date(raw[k], k);
    for (const k of ["gross", "gst", "tds", "retention", "otherDeduction"])
      data[k] = money(raw[k] ?? "0", k);
    data.net = data.gross - data.tds - data.retention - data.otherDeduction;
    demand(data.net > 0, "Net claim amount must be positive after deductions.");
    demand(
      data.gst <= data.gross,
      "GST included in gross cannot exceed gross.",
    );
    if (data.periodStart && data.periodEnd)
      demand(
        data.periodEnd >= data.periodStart,
        "Work period end must follow its start.",
      );
    return this.transaction(() => {
      const old = id ? this.claim(id) : null;
      if (old) {
        revision(old, raw);
        demand(old.status === "Draft", "Only draft claims can be edited.");
        demand(
          old.societyId === data.societyId,
          "A claim cannot move Society.",
        );
      }
      sameScope(this, data);
      const beneficiary = master(this, "beneficiaries", data.beneficiaryId);
      demand(
        beneficiary.societyId === data.societyId,
        "Beneficiary must belong to the selected Society.",
      );
      data.category = beneficiary.category;
      const duplicate = this.claims().find(
        (c) =>
          c.id !== id &&
          c.status !== "Cancelled" &&
          c.beneficiaryId === data.beneficiaryId &&
          c.reference.toLowerCase() === data.reference.toLowerCase(),
      );
      demand(
        !duplicate,
        "This beneficiary claim reference already exists. Record another instalment against the existing claim.",
        409,
      );
      const now = new Date().toISOString(),
        recordId = id || randomUUID();
      this.db
        .prepare(
          `INSERT INTO claims VALUES(?,?,'Draft',?,1,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,revision=claims.revision+1,updated_at=excluded.updated_at`,
        )
        .run(
          recordId,
          old?.ref || this.nextFinancialRef("CLM"),
          encrypt(data, this.key),
          now,
          now,
        );
      this.audit(
        actor,
        old ? "Claim draft updated" : "Claim created",
        recordId,
        data.societyId,
        "",
        old,
        data,
      );
      return this.claim(recordId);
    });
  },
  transitionClaim(actor, id, action, raw) {
    return this.transaction(() => {
      const claim = this.claim(id);
      revision(claim, raw);
      confirm(raw);
      demand(["approve", "cancel"].includes(action), "Unknown claim action.");
      demand(
        action === "approve"
          ? claim.status === "Draft"
          : ["Draft", "Approved"].includes(claim.status),
        "Claim state does not allow this action.",
        409,
      );
      if (action === "approve") {
        sameScope(this, claim);
        master(this, "beneficiaries", claim.beneficiaryId);
        if (claim.category === "Supplier")
          demand(claim.invoiceDate, "Supplier invoice date is required.");
        if (claim.category === "Sub-contractor")
          demand(
            claim.description && claim.certification,
            "Work description and certification reference are required.",
          );
        if (
          claim.category.includes("labour") ||
          claim.category === "Labour contractor"
        )
          demand(
            claim.periodStart && claim.periodEnd && claim.certification,
            "Labour claims require a work period and attendance / certification reference.",
          );
        if (claim.category === "Individual labourer") {
          demand(
            claim.quantity && claim.rate,
            "Individual labour claims require days / quantity and rate.",
          );
          demand(
            /^\d{1,8}(\.\d{1,4})?$/.test(claim.quantity) &&
              Number(claim.quantity) > 0 &&
              money(claim.rate, "Rate") > 0,
            "Days / quantity and rate must be positive numeric values.",
          );
        }
      } else
        demand(
          claim.paid === 0,
          "Reverse posted payments before cancelling this claim.",
        );
      const why = action === "cancel" ? reason(raw) : "";
      this.db
        .prepare(
          "UPDATE claims SET status=?,revision=revision+1,updated_at=? WHERE id=?",
        )
        .run(
          action === "approve" ? "Approved" : "Cancelled",
          new Date().toISOString(),
          id,
        );
      this.audit(
        actor,
        action === "approve" ? "Claim approved locally" : "Claim cancelled",
        id,
        claim.societyId,
        why,
      );
      return this.claim(id);
    });
  },
  payments() {
    return this.db
      .prepare("SELECT * FROM payments ORDER BY created_at DESC")
      .all()
      .map((row) => this.payment(row.id));
  },
  reversal(kind, id) {
    const row = this.db
      .prepare("SELECT * FROM reversals WHERE kind=? AND source_id=?")
      .get(kind, id);
    return row
      ? {
          ...decrypt(row.payload, this.key),
          id: row.id,
          createdAt: row.created_at,
        }
      : null;
  },
  payment(id) {
    const result = read(
      this,
      this.db.prepare("SELECT * FROM payments WHERE id=?").get(id),
    );
    result.reversal = this.reversal("payments", id);
    if (result.reversal) result.status = result.reversal.outcome;
    result.evidence = this.db
      .prepare("SELECT * FROM payment_evidence WHERE payment_id=?")
      .all(id)
      .map((row) => {
        const { data, ...meta } = decrypt(row.payload, this.key);
        return { id: row.id, ...meta };
      });
    return result;
  },
  savePayment(actor, id, raw) {
    const data = {};
    for (const k of [
      "societyId",
      "projectId",
      "bankId",
      "reference",
      "chequeNumber",
      "remarks",
      "correctionOf",
    ])
      data[k] = text(
        raw[k],
        k,
        ["societyId", "projectId", "bankId"].includes(k),
        k === "remarks" ? 2000 : 240,
      );
    data.paymentDate = date(raw.paymentDate, "Payment date", true);
    data.valueDate = date(raw.valueDate, "Value date", true);
    data.mode = text(raw.mode || "NEFT", "Mode");
    demand(
      ["NEFT", "RTGS", "IMPS", "UPI", "Cheque", "Cash", "Other"].includes(
        data.mode,
      ),
      "Invalid payment mode.",
    );
    data.batch = raw.batch === true;
    data.distributions = lines(raw.distributions, "claimId");
    data.allocations = lines(raw.allocations, "receiptId");
    data.amount = sum(data.distributions);
    demand(
      data.batch || data.distributions.length === 1,
      "Use a batch for multiple claim distributions.",
    );
    demand(
      sum(data.allocations) === data.amount,
      "Receipt allocations must equal the bank debit.",
    );
    return this.transaction(() => {
      const old = id ? this.payment(id) : null;
      if (old) {
        revision(old, raw);
        demand(
          old.status === "Draft",
          "Only draft payments can be edited.",
          409,
        );
        demand(
          old.societyId === data.societyId,
          "A payment cannot move Society.",
        );
      }
      sameScope(this, data, true);
      if (data.correctionOf) {
        const original = this.payment(data.correctionOf);
        demand(
          ["Reversed", "Failed", "Cancelled"].includes(original.status) &&
            original.societyId === data.societyId,
          "Corrections must link to a reversed, failed or cancelled payment in this Society.",
        );
      }
      this.validatePayment(data, false);
      const now = new Date().toISOString(),
        recordId = id || randomUUID();
      this.db
        .prepare(
          `INSERT INTO payments VALUES(?,NULL,'Draft',?,1,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,revision=payments.revision+1,updated_at=excluded.updated_at`,
        )
        .run(recordId, encrypt(data, this.key), now, now);
      this.audit(
        actor,
        old ? "Payment draft updated" : "Payment draft created",
        recordId,
        data.societyId,
        "",
        old,
        data,
      );
      return this.payment(recordId);
    });
  },
  validatePayment(payment, posting) {
    sameScope(this, payment, true);
    const bank = master(this, "banks", payment.bankId);
    demand(
      payment.paymentDate >= bank.openingDate,
      "Payment date precedes the bank opening balance date.",
    );
    for (const row of payment.distributions) {
      this.checkReleaseDate("claim", row.claimId, payment.paymentDate);
      const claim = this.claim(row.claimId);
      demand(
        claim.status === "Approved" &&
          claim.societyId === payment.societyId &&
          claim.projectId === payment.projectId,
        "Select approved claims from this Society and project.",
      );
      master(this, "beneficiaries", claim.beneficiaryId);
      demand(
        !payment.batch ||
          ["Individual labourer", "Labour contractor"].includes(claim.category),
        "Batch distributions must be labour claims.",
      );
      if (posting)
        demand(
          row.amount <= claim.pending,
          "Payment exceeds the remaining claim amount.",
          409,
        );
    }
    for (const row of payment.allocations) {
      this.checkReleaseDate("receipt", row.receiptId, payment.paymentDate);
      const receipt = this.receipt(row.receiptId);
      demand(
        receipt.status === "Posted" &&
          receipt.societyId === payment.societyId &&
          receipt.projectId === payment.projectId &&
          receipt.bankId === payment.bankId,
        "Funding must use posted receipts from the same Society, project and bank account.",
      );
      demand(
        receipt.creditDate <= payment.paymentDate,
        "Payment date cannot precede its funding receipt.",
      );
      if (posting)
        demand(
          row.amount <= receipt.available,
          "Allocation exceeds the available receipt balance. Reload and revise the draft.",
          409,
        );
    }
    demand(
      sum(payment.allocations) === payment.amount &&
        sum(payment.distributions) === payment.amount,
      "Distributions and allocations must equal the bank debit.",
    );
  },
  transitionPayment(actor, id, action, raw) {
    return this.transaction(() => {
      const p = this.payment(id);
      revision(p, raw);
      confirm(raw);
      const allowed = {
        submit: ["Draft"],
        approve: ["Submitted"],
        post: ["Approved"],
        return: ["Submitted", "Approved"],
        cancel: ["Draft", "Submitted", "Approved"],
        fail: ["Draft", "Submitted", "Approved"],
      };
      demand(
        allowed[action]?.includes(p.status),
        "Payment state does not allow this action.",
        409,
      );
      const why = ["return", "cancel", "fail"].includes(action)
        ? reason(raw)
        : "";
      if (["submit", "approve", "post"].includes(action)) {
        this.validatePayment(p, true);
        demand(
          p.evidence.length > 0,
          "Attach supporting payment evidence before submission.",
        );
        demand(
          p.mode === "Cheque"
            ? p.chequeNumber
            : ["Cash", "Other"].includes(p.mode)
              ? p.remarks
              : p.reference,
          "Provide the payment reference, cheque number or cash/other remarks.",
        );
      }
      let ref = p.ref;
      if (action === "post") {
        this.assertPeriodOpen(p.bankId, p.paymentDate);
        const others = this.payments().filter(
          (x) => x.id !== id && x.status === "Posted" && x.bankId === p.bankId,
        );
        demand(
          !others.some(
            (x) =>
              (p.reference &&
                x.reference.toUpperCase() === p.reference.toUpperCase()) ||
              (p.chequeNumber && x.chequeNumber === p.chequeNumber),
          ),
          "This bank reference or cheque has already been posted.",
          409,
        );
        const matches = others.filter(
          (x) => x.amount === p.amount && x.paymentDate === p.paymentDate,
        );
        if (matches.length) {
          demand(
            raw.override === true,
            "Possible duplicate amount and date. Confirm a separate debit and provide a reason.",
            409,
          );
          reason(raw);
        }
        this.assertBankMovement(p.bankId, p.paymentDate, -p.amount);
        ref = this.nextFinancialRef("OUT", financialYear(p.paymentDate));
        for (const row of p.distributions)
          this.db
            .prepare("INSERT INTO distributions VALUES(?,?,?)")
            .run(id, row.claimId, row.amount);
        for (const row of p.allocations)
          this.db
            .prepare("INSERT INTO allocations VALUES(?,?,?)")
            .run(id, row.receiptId, row.amount);
      }
      const status = {
        submit: "Submitted",
        approve: "Approved",
        post: "Posted",
        return: "Draft",
        cancel: "Cancelled",
        fail: "Failed",
      }[action];
      this.db
        .prepare(
          "UPDATE payments SET status=?,ref=?,revision=revision+1,updated_at=? WHERE id=?",
        )
        .run(status, ref, new Date().toISOString(), id);
      this.audit(
        actor,
        `Payment ${status.toLowerCase()}`,
        id,
        p.societyId,
        why ||
          (action === "post" ? text(raw.reason, "Reason", false, 1000) : ""),
        null,
        { ref, amount: p.amount },
      );
      return this.payment(id);
    });
  },
  addPaymentEvidence(actor, id, raw) {
    return this.transaction(() => {
      const p = this.payment(id);
      revision(p, raw);
      demand(
        p.status === "Draft",
        "Return the payment to draft before attaching evidence.",
        409,
      );
      demand(p.evidence.length < 5, "Maximum five evidence files per payment.");
      const file = evidencePayload(raw);
      this.db
        .prepare("INSERT INTO payment_evidence VALUES(?,?,?)")
        .run(randomUUID(), id, encrypt(file, this.key));
      this.db
        .prepare(
          "UPDATE payments SET revision=revision+1,updated_at=? WHERE id=?",
        )
        .run(new Date().toISOString(), id);
      this.audit(
        actor,
        "Payment evidence attached",
        id,
        p.societyId,
        "",
        null,
        { name: file.name, size: file.size },
      );
      return this.payment(id);
    });
  },
  paymentEvidenceFile(id, fileId) {
    const row = this.db
      .prepare("SELECT * FROM payment_evidence WHERE id=? AND payment_id=?")
      .get(fileId, id);
    demand(row, "Evidence not found.", 404);
    return decrypt(row.payload, this.key);
  },
  receiptAllocation(id, includeReversed = false) {
    return this.db
      .prepare(
        `SELECT a.payment_id,a.amount,p.ref,r.payload AS reversal_payload FROM allocations a JOIN payments p ON p.id=a.payment_id
        LEFT JOIN reversals r ON r.kind='payments' AND r.source_id=p.id
        WHERE a.receipt_id=? AND (?=1 OR r.id IS NULL) ORDER BY p.created_at,p.id`,
      )
      .all(id, includeReversed ? 1 : 0)
      .map(({ reversal_payload, ...row }) => ({
        ...row,
        status: reversal_payload
          ? decrypt(reversal_payload, this.key).outcome
          : "Posted",
      }));
  },
  reverseFinancial(actor, kind, id, raw) {
    return this.transaction(() => {
      demand(["receipts", "payments"].includes(kind), "Unknown reversal type.");
      const source = kind === "receipts" ? this.receipt(id) : this.payment(id);
      demand(
        source.status === "Posted",
        "Only an unreversed posted record can be reversed.",
        409,
      );
      revision(source, raw);
      confirm(raw);
      const why = reason(raw),
        day = date(raw.date, "Reversal date", true),
        reference = text(
          raw.reference,
          "Bank reversal evidence reference",
          true,
        );
      demand(
        day >= (source.creditDate || source.paymentDate),
        "Reversal date cannot precede the original bank movement.",
      );
      if (kind === "receipts") {
        this.checkReleaseDate("receipt", id, day);
        demand(
          source.available === source.amount,
          "Reverse all linked payments before reversing this receipt.",
          409,
        );
      }
      const amount = kind === "receipts" ? -source.amount : source.amount;
      this.assertPeriodOpen(source.bankId, day);
      this.assertBankMovement(source.bankId, day, amount);
      const outcome =
        raw.outcome === "Failed" && kind === "payments" ? "Failed" : "Reversed";
      const reversal = {
        date: day,
        reason: why,
        reference,
        amount,
        bankId: source.bankId,
        outcome,
      };
      this.db
        .prepare("INSERT INTO reversals VALUES(?,?,?,?,?)")
        .run(
          randomUUID(),
          kind,
          id,
          encrypt(reversal, this.key),
          new Date().toISOString(),
        );
      this.audit(
        actor,
        `${kind === "receipts" ? "Receipt" : "Payment"} ${outcome.toLowerCase()}`,
        id,
        source.societyId,
        why,
        null,
        reversal,
      );
      return kind === "receipts" ? this.receipt(id) : this.payment(id);
    });
  },
  assertBankMovement(bankId, day, amount) {
    const book = this.bankBook().find((b) => b.bank.id === bankId);
    demand(book, "Bank account not found.");
    let balance = book.bank.openingBalance;
    const entries = [
      ...book.entries.map((e) => ({ day: e.credit_date, amount: e.amount })),
      { day, amount },
    ].sort((a, b) => a.day.localeCompare(b.day));
    for (const entry of entries) {
      balance += entry.amount;
      demand(
        Number.isSafeInteger(balance) && balance >= 0,
        "This movement would overdraw the bank book on its date or a later date.",
        409,
      );
    }
  },
  checkReleaseDate(kind, id, day) {
    const rows = this.db
      .prepare(
        kind === "claim"
          ? "SELECT r.payload FROM reversals r JOIN distributions d ON d.payment_id=r.source_id WHERE r.kind='payments' AND d.claim_id=?"
          : "SELECT r.payload FROM reversals r JOIN allocations a ON a.payment_id=r.source_id WHERE r.kind='payments' AND a.receipt_id=?",
      )
      .all(id);
    for (const row of rows)
      demand(
        day >= decrypt(row.payload, this.key).date,
        "Use a date on or after the latest linked payment reversal; released funding cannot be backdated.",
        409,
      );
  },
  bankBook(actor) {
    const eventOrder = new Map(
      this.db
        .prepare(
          "SELECT id,entity_id,action FROM audit WHERE action IN ('Receipt posted','Payment posted','Receipt reversed','Payment reversed','Payment failed','Bank adjustment posted') ORDER BY id",
        )
        .all()
        .map((e) => [`${e.entity_id}:${e.action}`, e.id]),
    );
    const payments = this.db
      .prepare("SELECT * FROM payments WHERE status='Posted'")
      .all()
      .map((row) => read(this, row));
    const reversals = this.db
      .prepare("SELECT * FROM reversals")
      .all()
      .map((row) => ({ ...row, ...decrypt(row.payload, this.key) }));
    const receiptReferences = new Map(
      this.db
        .prepare("SELECT id,payload FROM receipts")
        .all()
        .map((r) => {
          const d = decrypt(r.payload, this.key);
          return [r.id, d.reference || d.chequeNumber || ""];
        }),
    );
    const adjustments = this.otherMovements();
    return this.list(actor, "banks").map((bank) => {
      const entries = this.db
        .prepare(
          `SELECT b.*,r.payment_id,r.created_at FROM bank_entries b JOIN receipts r ON r.id=b.receipt_id WHERE b.bank_id=?`,
        )
        .all(bank.id)
        .map((e) => ({
          ...e,
          page: "receipts",
          entity_id: e.receipt_id,
          event: "Receipt",
          movement_key: `receipt:${e.receipt_id}`,
          reference: receiptReferences.get(e.receipt_id),
          order: eventOrder.get(`${e.receipt_id}:Receipt posted`) || 0,
        }));
      for (const p of payments.filter((p) => p.bankId === bank.id))
        entries.push({
          credit_date: p.paymentDate,
          amount: -p.amount,
          payment_id: p.ref,
          created_at: p.updatedAt,
          page: "payments",
          entity_id: p.id,
          event: "Payment",
          movement_key: `payment:${p.id}`,
          reference: p.reference || p.chequeNumber || "",
          order: eventOrder.get(`${p.id}:Payment posted`) || 0,
        });
      for (const r of reversals.filter((r) => r.bankId === bank.id))
        entries.push({
          credit_date: r.date,
          amount: r.amount,
          payment_id: `Reversal ${r.reference}`,
          created_at: r.created_at,
          page: r.kind,
          entity_id: r.source_id,
          event: r.outcome,
          movement_key: `reversal:${r.id}`,
          reference: r.reference,
          order:
            eventOrder.get(
              `${r.source_id}:${r.kind === "payments" ? "Payment" : "Receipt"} ${r.outcome.toLowerCase()}`,
            ) || 0,
        });
      for (const m of adjustments.filter((m) => m.bankId === bank.id))
        entries.push({
          credit_date: m.date,
          amount: m.amount,
          payment_id: m.ref,
          created_at: m.createdAt,
          page: "bankmovements",
          entity_id: m.id,
          event: m.reversalOf ? "Adjustment reversal" : m.category,
          movement_key: `adjustment:${m.id}`,
          reference: m.reference,
          order: eventOrder.get(`${m.id}:Bank adjustment posted`) || 0,
        });
      entries.sort(
        (a, b) =>
          a.credit_date.localeCompare(b.credit_date) || a.order - b.order,
      );
      let balance = bank.openingBalance;
      return {
        bank,
        entries: entries.map((e) => ({ ...e, balance: (balance += e.amount) })),
        balance,
      };
    });
  },
};
