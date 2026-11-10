import { randomUUID } from "node:crypto";
import { text, date, money, demand } from "./domain.mjs";
import { encrypt, decrypt } from "./security.mjs";
import { evidencePayload } from "./payments.mjs";
import { confirmed, documentedReason } from "./reconciliation.mjs";

export function initializeTax(store) {
  store.db.exec(`BEGIN IMMEDIATE;
    CREATE TABLE IF NOT EXISTS tax_rules(id TEXT PRIMARY KEY,society_id TEXT NOT NULL REFERENCES records(id),tax_type TEXT NOT NULL,effective_from TEXT NOT NULL,payload TEXT NOT NULL,UNIQUE(society_id,tax_type,effective_from));
    CREATE TABLE IF NOT EXISTS tax_records(id TEXT PRIMARY KEY,ref TEXT UNIQUE NOT NULL,society_id TEXT NOT NULL REFERENCES records(id),payload TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS tax_events(id TEXT PRIMARY KEY,record_id TEXT NOT NULL REFERENCES tax_records(id),payload TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS tax_evidence(id TEXT PRIMARY KEY,record_id TEXT NOT NULL REFERENCES tax_records(id),payload TEXT NOT NULL);
    PRAGMA user_version=4; COMMIT;`);
  for (const table of [
    "tax_rules",
    "tax_records",
    "tax_events",
    "tax_evidence",
  ])
    for (const action of ["UPDATE", "DELETE"])
      store.db.exec(
        `CREATE TRIGGER IF NOT EXISTS ${table}_no_${action.toLowerCase()} BEFORE ${action} ON ${table} BEGIN SELECT RAISE(ABORT,'Tax history is immutable'); END;`,
      );
}
function unpack(store, row) {
  demand(row, "Tax record not found.", 404);
  return {
    ...decrypt(row.payload, store.key),
    id: row.id,
    ...(row.ref ? { ref: row.ref } : {}),
    ...(row.created_at ? { createdAt: row.created_at } : {}),
  };
}
function active(store, kind, id) {
  const row = store.db
    .prepare("SELECT * FROM records WHERE id=? AND kind=?")
    .get(id, kind);
  demand(row?.status === "Active", `Select an active ${kind} record.`);
  return store.readRecord(row, true);
}
export function calculateTax(base, rate) {
  const result = (BigInt(base) * BigInt(rate) + 5000n) / 10000n;
  demand(
    result <= BigInt(Number.MAX_SAFE_INTEGER),
    "Calculated tax is too large.",
  );
  return Number(result);
}
export const taxMethods = {
  taxRules() {
    return this.db
      .prepare("SELECT * FROM tax_rules ORDER BY effective_from DESC")
      .all()
      .map((r) => unpack(this, r));
  },
  saveTaxRule(actor, raw) {
    return this.transaction(() => {
      confirmed(raw);
      const societyId = text(raw.societyId, "Society", true);
      active(this, "societies", societyId);
      const taxType = text(raw.taxType, "Tax treatment name", true, 100),
        effectiveFrom = date(raw.effectiveFrom, "Effective from", true),
        rate = money(raw.rate, "Rate");
      demand(rate <= 10000, "Rate must be between 0 and 100 percent.");
      this.assertTaxPeriodOpen(societyId, effectiveFrom);
      const existing = this.taxRules().filter(
        (r) =>
          r.societyId === societyId &&
          r.taxType.toLowerCase() === taxType.toLowerCase(),
      );
      demand(
        existing.every((r) => r.effectiveFrom < effectiveFrom),
        "Add a later effective date for this Society/treatment; historical rule versions cannot be replaced.",
      );
      const id = randomUUID(),
        data = {
          societyId,
          taxType,
          effectiveFrom,
          rate,
          basis: text(raw.basis, "Calculation basis", true, 1000),
          evidenceReference: text(
            raw.evidenceReference,
            "Accountant confirmation / evidence reference",
            true,
          ),
          reason: documentedReason(raw),
        };
      this.db
        .prepare("INSERT INTO tax_rules VALUES(?,?,?,?,?)")
        .run(id, societyId, taxType, effectiveFrom, encrypt(data, this.key));
      this.audit(
        actor,
        "Tax treatment configured",
        id,
        societyId,
        data.reason,
        null,
        data,
      );
      return { ...data, id };
    });
  },
  taxes() {
    return this.db
      .prepare("SELECT id FROM tax_records ORDER BY created_at DESC")
      .all()
      .map((r) => this.taxRecord(r.id));
  },
  taxRecord(id) {
    const record = unpack(
      this,
      this.db.prepare("SELECT * FROM tax_records WHERE id=?").get(id),
    );
    const events = this.db
      .prepare("SELECT * FROM tax_events WHERE record_id=? ORDER BY rowid")
      .all(id)
      .map((r) => unpack(this, r));
    let credited = 0,
      used = 0,
      status = record.initialStatus;
    for (const e of events) {
      if (["Credit", "Adjustment increase"].includes(e.kind))
        credited += e.amount;
      if (e.kind === "Adjustment decrease") credited -= e.amount;
      if (e.kind === "Set-off") used += e.amount;
      if (e.kind === "Status") status = e.status;
    }
    demand(
      Number.isSafeInteger(credited) && Number.isSafeInteger(used),
      "Tax totals exceed the supported range.",
    );
    if (status !== "Disputed" && credited > 0)
      status =
        used === credited
          ? "Fully Set Off"
          : used > 0
            ? "Partly Set Off"
            : "Credited";
    const evidence = this.db
      .prepare("SELECT * FROM tax_evidence WHERE record_id=?")
      .all(id)
      .map((r) => {
        const { data, ...meta } = decrypt(r.payload, this.key);
        return { ...meta, id: r.id };
      });
    return {
      ...record,
      events,
      credited,
      used,
      available: credited - used,
      status,
      evidence,
    };
  },
  saveTaxRecord(actor, raw) {
    return this.transaction(() => {
      confirmed(raw);
      const societyId = text(raw.societyId, "Society", true),
        projectId = text(raw.projectId, "Project", true);
      active(this, "societies", societyId);
      const project = active(this, "projects", projectId);
      demand(
        project.societyId === societyId,
        "Project must belong to this Society.",
      );
      const day = date(raw.date, "Tax date", true);
      this.assertTaxPeriodOpen(societyId, day);
      const rule = this.taxRules().find((r) => r.id === raw.ruleId);
      demand(
        rule && rule.societyId === societyId && rule.effectiveFrom <= day,
        "Choose an effective tax treatment for this Society/date.",
      );
      const current = this.taxRules().find(
        (r) =>
          r.societyId === societyId &&
          r.taxType.toLowerCase() === rule.taxType.toLowerCase() &&
          r.effectiveFrom <= day,
      );
      demand(
        current.id === rule.id,
        "Choose the latest treatment effective on the tax date.",
      );
      const base = money(raw.base, "Tax base"),
        calculated = calculateTax(base, rule.rate),
        expected =
          raw.expected == null || raw.expected === ""
            ? calculated
            : money(raw.expected, "Expected tax");
      const reason =
        expected !== calculated
          ? documentedReason(raw)
          : text(raw.reason, "Reason", false, 1000);
      const deducted = money(raw.deducted || "0", "Deducted amount"),
        bankAmount = money(raw.bankAmount || "0", "Bank amount annotation"),
        receiptId = text(raw.receiptId, "Receipt", false);
      if (receiptId) {
        const receipt = this.receipt(receiptId);
        demand(
          receipt.status === "Posted" &&
            receipt.societyId === societyId &&
            receipt.projectId === projectId,
          "Link a posted receipt in this Society/project.",
        );
        demand(
          bankAmount <= receipt.amount,
          "Bank annotation cannot exceed the linked receipt credit.",
        );
      } else
        demand(
          bankAmount === 0,
          "Bank amount annotations require an actual linked receipt. They never post cash.",
        );
      const reference = text(
          raw.reference,
          "Tax certificate / ledger reference",
          true,
        ),
        initialStatus = raw.initialStatus || "Expected";
      demand(
        ["Expected", "Deducted", "Credit Pending", "Disputed"].includes(
          initialStatus,
        ),
        "Select an initial tax status.",
      );
      demand(
        !this.taxes().some(
          (t) =>
            t.societyId === societyId &&
            t.reference.toLowerCase() === reference.toLowerCase(),
        ),
        "This tax reference already exists in the Society.",
        409,
      );
      const proof = evidencePayload(raw.evidence || {}),
        id = randomUUID(),
        ref = this.nextFinancialRef("TAX"),
        data = {
          societyId,
          projectId,
          departmentId: project.departmentId,
          receiptId,
          date: day,
          ruleId: rule.id,
          taxType: rule.taxType,
          rate: rule.rate,
          basis: rule.basis,
          method: "Base × rate, half-up to one paise",
          base,
          calculated,
          expected,
          deducted,
          bankAmount,
          reference,
          initialStatus,
          reason,
        };
      this.db
        .prepare("INSERT INTO tax_records VALUES(?,?,?,?,?)")
        .run(
          id,
          ref,
          societyId,
          encrypt(data, this.key),
          new Date().toISOString(),
        );
      this.db
        .prepare("INSERT INTO tax_evidence VALUES(?,?,?)")
        .run(
          randomUUID(),
          id,
          encrypt(
            { ...proof, reference, purpose: "Initial tax record" },
            this.key,
          ),
        );
      this.audit(actor, "Tax record created", id, societyId, reason, null, {
        ...data,
        ref,
      });
      return this.taxRecord(id);
    });
  },
  addTaxEvent(actor, id, raw) {
    return this.transaction(() => {
      confirmed(raw);
      const record = this.taxRecord(id),
        kind = text(raw.kind, "Tax event type", true),
        day = date(raw.date, "Tax event date", true),
        reason = documentedReason(raw),
        reference = text(raw.reference, "Evidence reference", true);
      demand(
        [
          "Credit",
          "Set-off",
          "Adjustment increase",
          "Adjustment decrease",
          "Status",
        ].includes(kind),
        "Invalid tax event type.",
      );
      demand(
        day >= record.date && record.events.every((e) => e.date <= day),
        "Tax events must not precede the record or its latest event date.",
      );
      this.assertTaxPeriodOpen(record.societyId, day);
      const amount =
        kind === "Status" ? 0 : money(raw.amount, "Tax event amount");
      demand(kind === "Status" || amount > 0, "Amount must be positive.");
      if (kind === "Credit")
        demand(
          record.credited + amount <= record.expected,
          "Credit exceeds the recorded expected amount. Use a documented adjustment for a confirmed difference.",
        );
      if (["Set-off", "Adjustment decrease"].includes(kind))
        demand(
          amount <= record.available,
          "Tax event exceeds available tax credit.",
          409,
        );
      if (kind === "Set-off")
        demand(
          record.status !== "Disputed",
          "Resolve the tax dispute before recording set-off.",
        );
      if (kind === "Status")
        demand(
          ["Expected", "Deducted", "Credit Pending", "Disputed"].includes(
            raw.status,
          ),
          "Select a valid status.",
        );
      demand(
        !record.events.some(
          (e) => e.reference.toLowerCase() === reference.toLowerCase(),
        ),
        "This event evidence reference already exists.",
        409,
      );
      const proof = evidencePayload(raw.evidence || {}),
        eventId = randomUUID(),
        data = {
          kind,
          date: day,
          amount,
          reason,
          reference,
          ...(kind === "Status" ? { status: raw.status } : {}),
        };
      this.db
        .prepare("INSERT INTO tax_events VALUES(?,?,?,?)")
        .run(eventId, id, encrypt(data, this.key), new Date().toISOString());
      this.db
        .prepare("INSERT INTO tax_evidence VALUES(?,?,?)")
        .run(
          randomUUID(),
          id,
          encrypt({ ...proof, reference, purpose: kind, eventId }, this.key),
        );
      this.audit(
        actor,
        `Tax ${kind.toLowerCase()} recorded`,
        id,
        record.societyId,
        reason,
        null,
        data,
      );
      return this.taxRecord(id);
    });
  },
  taxEvidence(id, fileId) {
    const row = this.db
      .prepare("SELECT * FROM tax_evidence WHERE id=? AND record_id=?")
      .get(fileId, id);
    demand(row, "Evidence not found.", 404);
    return decrypt(row.payload, this.key);
  },
};
