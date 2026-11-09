import { randomUUID } from "node:crypto";
import { demand, text, money, date, financialYear } from "./domain.mjs";
import { encrypt, decrypt } from "./security.mjs";

export function initializeReceipts(store) {
  store.db.exec(`CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY, society_id TEXT NOT NULL REFERENCES records(id),
    bank_id TEXT REFERENCES records(id), payment_id TEXT UNIQUE,
    status TEXT NOT NULL CHECK(status IN ('Draft','Posted')), payload TEXT NOT NULL,
    revision INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY, receipt_id TEXT NOT NULL REFERENCES receipts(id), payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS bank_entries (
    receipt_id TEXT PRIMARY KEY REFERENCES receipts(id), bank_id TEXT NOT NULL REFERENCES records(id),
    credit_date TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount > 0));
    CREATE TRIGGER IF NOT EXISTS posted_receipt_no_update BEFORE UPDATE ON receipts
      WHEN OLD.status='Posted' BEGIN SELECT RAISE(ABORT,'Posted receipts are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS receipt_no_delete BEFORE DELETE ON receipts
      BEGIN SELECT RAISE(ABORT,'Receipts cannot be deleted'); END;
    CREATE TRIGGER IF NOT EXISTS bank_entry_no_update BEFORE UPDATE ON bank_entries
      BEGIN SELECT RAISE(ABORT,'Bank entries are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS bank_entry_no_delete BEFORE DELETE ON bank_entries
      BEGIN SELECT RAISE(ABORT,'Bank entries cannot be deleted'); END;
    `);
}
function read(store, row) {
  demand(row, "Receipt not found.", 404);
  return {
    ...decrypt(row.payload, store.key),
    id: row.id,
    paymentId: row.payment_id,
    status: row.status,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
function master(store, kind, id, required = true) {
  if (!id && !required) return null;
  const row = store.db
    .prepare("SELECT * FROM records WHERE id=? AND kind=?")
    .get(id, kind);
  demand(row && row.status === "Active", `Select an active ${kind} record.`);
  return store.readRecord(row, true);
}
function normalize(raw) {
  const data = {};
  for (const k of [
    "societyId",
    "departmentId",
    "projectId",
    "bankId",
    "billNumber",
    "reference",
    "chequeNumber",
  ])
    data[k] = text(raw[k], k, k === "societyId");
  data.billType = text(raw.billType || "RA Bill", "Bill type");
  data.mode = text(raw.mode || "NEFT", "Payment mode");
  demand(
    ["RA Bill", "Final Bill", "Other"].includes(data.billType),
    "Select a valid bill type.",
  );
  demand(
    ["NEFT", "RTGS", "IMPS", "UPI", "Cheque", "Other"].includes(data.mode),
    "Select a valid payment mode.",
  );
  for (const k of ["creditDate", "valueDate"]) data[k] = date(raw[k], k);
  for (const k of ["amount", "grossBill", "gstDeduction", "taxCredit"])
    data[k] = money(raw[k] === "" || raw[k] == null ? "0" : raw[k], k);
  data.narration = text(raw.narration, "Narration", false, 2000);
  return data;
}
function validateLinks(store, data, posting) {
  const society = master(store, "societies", data.societyId);
  master(store, "departments", data.departmentId, posting);
  const project = master(store, "projects", data.projectId, posting);
  const bank = master(store, "banks", data.bankId, posting);
  if (project)
    demand(
      project.societyId === data.societyId &&
        project.departmentId === data.departmentId,
      "Project must belong to the selected Society and department.",
    );
  if (bank) {
    demand(
      bank.societyId === data.societyId,
      "Bank account must belong to the selected Society.",
    );
    if (data.creditDate)
      demand(
        data.creditDate >= bank.openingDate,
        "Credit date must be on or after the bank opening balance date.",
      );
  }
  return society;
}
export const receiptMethods = {
  receipts() {
    return this.db
      .prepare("SELECT * FROM receipts ORDER BY created_at DESC")
      .all()
      .map((row) => {
        const result = read(this, row);
        if (this.reversal("receipts", row.id)) result.status = "Reversed";
        result.available =
          result.status === "Posted"
            ? result.amount -
              this.receiptAllocation(row.id).reduce((n, r) => n + r.amount, 0)
            : 0;
        return result;
      });
  },
  receipt(id) {
    const result = read(
      this,
      this.db.prepare("SELECT * FROM receipts WHERE id=?").get(id),
    );
    result.evidence = this.db
      .prepare("SELECT * FROM evidence WHERE receipt_id=?")
      .all(id)
      .map((row) => {
        const { data, ...metadata } = decrypt(row.payload, this.key);
        return { id: row.id, ...metadata };
      });
    result.duplicates = this.receipts()
      .filter(
        (r) =>
          r.id !== id &&
          r.status === "Posted" &&
          r.bankId === result.bankId &&
          ((result.reference &&
            r.reference.toUpperCase() === result.reference.toUpperCase()) ||
            (result.chequeNumber && r.chequeNumber === result.chequeNumber) ||
            (result.amount > 0 &&
              r.amount === result.amount &&
              r.creditDate === result.creditDate)),
      )
      .map((r) => ({ id: r.id, paymentId: r.paymentId }));
    result.reversal = this.reversal("receipts", id);
    if (result.reversal) result.status = "Reversed";
    result.allocations = this.receiptAllocation(id);
    result.allocationHistory = this.receiptAllocation(id, true);
    result.allocated = result.allocations.reduce((n, r) => n + r.amount, 0);
    result.available =
      result.status === "Posted" ? result.amount - result.allocated : 0;
    result.utilisation =
      result.status !== "Posted"
        ? result.status
        : result.available === 0
          ? "Fully utilised"
          : result.allocated > 0
            ? "Partially utilised"
            : "Unutilised";
    return result;
  },
  saveReceipt(actor, id, raw) {
    const data = normalize(raw);
    return this.transaction(() => {
      const old = id ? this.receipt(id) : null;
      if (old) {
        demand(
          old.status === "Draft",
          "Posted receipts cannot be edited.",
          409,
        );
        demand(
          raw.revision === old.revision,
          "Receipt changed. Reload before saving.",
          409,
        );
        demand(
          data.societyId === old.societyId,
          "A receipt cannot move to another Society.",
        );
      }
      validateLinks(this, data, false);
      const recordId = id || randomUUID(),
        now = new Date().toISOString();
      this.db
        .prepare(
          `INSERT INTO receipts VALUES(?,?,?,NULL,'Draft',?,1,?,?)
        ON CONFLICT(id) DO UPDATE SET bank_id=excluded.bank_id,payload=excluded.payload,
        revision=receipts.revision+1,updated_at=excluded.updated_at`,
        )
        .run(
          recordId,
          data.societyId,
          data.bankId || null,
          encrypt(data, this.key),
          now,
          now,
        );
      this.audit(
        actor,
        old ? "Receipt draft updated" : "Receipt draft created",
        recordId,
        data.societyId,
        "",
        old,
        data,
      );
      return this.receipt(recordId);
    });
  },
  postReceipt(actor, id, raw) {
    return this.transaction(() => {
      const receipt = this.receipt(id);
      demand(
        receipt.status === "Draft",
        "Receipt has already been posted.",
        409,
      );
      demand(
        raw.revision === receipt.revision,
        "Receipt changed. Reload before posting.",
        409,
      );
      demand(
        raw.confirm === true,
        "Confirm that this credit appears in the bank account.",
      );
      const society = validateLinks(this, receipt, true);
      demand(receipt.amount > 0, "Credited amount must be greater than zero.");
      demand(
        receipt.creditDate && receipt.valueDate,
        "Credit date and value date are required.",
      );
      demand(
        receipt.evidence.length > 0,
        "Attach bank evidence before posting.",
      );
      demand(
        receipt.mode === "Other"
          ? receipt.narration
          : receipt.mode === "Cheque"
            ? receipt.chequeNumber
            : receipt.reference,
        "Enter a bank reference, cheque number, or narration for Other mode.",
      );
      const reason = text(
        raw.duplicateReason,
        "Duplicate override reason",
        false,
        1000,
      );
      demand(
        !receipt.duplicates.length ||
          (raw.override === true && reason.length >= 10),
        "Possible duplicate bank credit. Review the linked receipts and explicitly override with a reason of at least 10 characters.",
        409,
      );
      const year = financialYear(receipt.creditDate);
      const bankTotal = this.bankBook(actor).find(
        (b) => b.bank.id === receipt.bankId,
      ).balance;
      demand(
        Number.isSafeInteger(bankTotal + receipt.amount),
        "Bank balance exceeds the supported monetary range.",
      );
      const number = this.db
        .prepare(
          `INSERT INTO series(key,value) VALUES(?,1)
        ON CONFLICT(key) DO UPDATE SET value=value+1 RETURNING value`,
        )
        .get(`receipt:${society.id}:${year}`).value;
      const paymentId = `LSP-${society.code}-${year}-${String(number).padStart(6, "0")}`;
      const now = new Date().toISOString();
      this.db
        .prepare(
          "UPDATE receipts SET status='Posted',payment_id=?,revision=revision+1,updated_at=? WHERE id=?",
        )
        .run(paymentId, now, id);
      this.db
        .prepare("INSERT INTO bank_entries VALUES(?,?,?,?)")
        .run(id, receipt.bankId, receipt.creditDate, receipt.amount);
      this.audit(actor, "Receipt posted", id, receipt.societyId, reason, null, {
        paymentId,
        amount: receipt.amount,
        creditDate: receipt.creditDate,
        duplicates: receipt.duplicates,
      });
      return this.receipt(id);
    });
  },
  addEvidence(actor, id, raw) {
    return this.transaction(() => {
      const receipt = this.receipt(id);
      demand(
        receipt.status === "Draft",
        "Evidence is locked after posting.",
        409,
      );
      demand(
        raw.revision === receipt.revision,
        "Receipt changed. Reload before adding evidence.",
        409,
      );
      demand(
        receipt.evidence.length < 5,
        "Maximum five evidence files per receipt.",
      );
      const name = text(raw.name, "File name", true, 160);
      demand(!/[\\/\x00-\x1f]/.test(name), "Use a plain file name.");
      demand(
        typeof raw.data === "string" && /^[A-Za-z0-9+/]*={0,2}$/.test(raw.data),
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
      const evidenceId = randomUUID();
      this.db
        .prepare("INSERT INTO evidence VALUES(?,?,?)")
        .run(
          evidenceId,
          id,
          encrypt(
            { name, type, size: bytes.length, data: bytes.toString("base64") },
            this.key,
          ),
        );
      this.db
        .prepare(
          "UPDATE receipts SET revision=revision+1,updated_at=? WHERE id=?",
        )
        .run(new Date().toISOString(), id);
      this.audit(
        actor,
        "Receipt evidence attached",
        id,
        receipt.societyId,
        "",
        null,
        { name, size: bytes.length },
      );
      return this.receipt(id);
    });
  },
  evidenceFile(id, fileId) {
    const row = this.db
      .prepare("SELECT * FROM evidence WHERE id=? AND receipt_id=?")
      .get(fileId, id);
    demand(row, "Evidence not found.", 404);
    return decrypt(row.payload, this.key);
  },
  bankBook(actor) {
    return this.list(actor, "banks").map((bank) => {
      const entries = this.db
        .prepare(
          `SELECT b.*,r.payment_id FROM bank_entries b JOIN receipts r ON r.id=b.receipt_id
        WHERE b.bank_id=? ORDER BY b.credit_date,r.created_at`,
        )
        .all(bank.id);
      let balance = bank.openingBalance;
      return {
        bank,
        entries: entries.map((e) => ({ ...e, balance: (balance += e.amount) })),
        balance,
      };
    });
  },
};
