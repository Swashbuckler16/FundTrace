import { DatabaseSync } from "node:sqlite";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import {
  demand,
  validate,
  prefixes,
  kinds,
  text,
  financialYear,
} from "./domain.mjs";
import { encrypt, decrypt, redact } from "./security.mjs";
import { initializeReceipts, receiptMethods } from "./receipts.mjs";
import { initializePayments, paymentMethods } from "./payments.mjs";
export const LOCAL_ACTOR = Object.freeze({
  id: "local-workspace",
  name: "Local workspace",
});

export class Store {
  constructor(directory, keyHex = process.env.FUNDTRACE_KEY) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const keyPath = join(directory, "encryption.key");
    if (!keyHex) {
      if (!existsSync(keyPath)) {
        demand(
          !existsSync(join(directory, "fundtrace.sqlite")),
          "Encryption key is missing. Restore the original key; do not replace it.",
          500,
        );
        writeFileSync(keyPath, randomBytes(32).toString("hex"), {
          mode: 0o600,
          flag: "wx",
        });
      }
      keyHex = readFileSync(keyPath, "utf8").trim();
    }
    demand(
      /^[a-f\d]{64}$/i.test(keyHex),
      "FUNDTRACE_KEY must contain 64 hexadecimal characters.",
      500,
    );
    this.key = Buffer.from(keyHex, "hex");
    this.db = new DatabaseSync(join(directory, "fundtrace.sqlite"), {
      timeout: 5000,
    });
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY, kind TEXT NOT NULL, ref TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
        society_id TEXT REFERENCES records(id), department_id TEXT REFERENCES records(id),
        status TEXT NOT NULL, payload TEXT NOT NULL, revision INTEGER NOT NULL,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS records_kind_scope ON records(kind, society_id);
      CREATE TABLE IF NOT EXISTS series (key TEXT PRIMARY KEY, value INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS audit (
        id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id TEXT, actor_name TEXT NOT NULL,
        action TEXT NOT NULL, entity_id TEXT, society_id TEXT, at TEXT NOT NULL,
        reason TEXT NOT NULL, before_json TEXT, after_json TEXT);
      CREATE INDEX IF NOT EXISTS audit_scope ON audit(society_id, id);
      CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit BEGIN SELECT RAISE(ABORT,'Audit is append-only'); END;
      CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit BEGIN SELECT RAISE(ABORT,'Audit is append-only'); END;
      `);
    initializeReceipts(this);
    initializePayments(this);
  }
  close() {
    this.db.close();
  }
  transaction(fn) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  audit(
    actor,
    action,
    entityId = null,
    societyId = null,
    reason = "",
    before = null,
    after = null,
  ) {
    this.db
      .prepare(
        "INSERT INTO audit(actor_id,actor_name,action,entity_id,society_id,at,reason,before_json,after_json) VALUES(?,?,?,?,?,?,?,?,?)",
      )
      .run(
        actor?.id || null,
        actor?.name || "System",
        action,
        entityId,
        societyId,
        new Date().toISOString(),
        reason,
        before ? encrypt(before, this.key) : null,
        after ? encrypt(after, this.key) : null,
      );
  }
  readRecord(row, sensitive = false) {
    const data = decrypt(row.payload, this.key);
    return {
      ...(sensitive ? data : redact(data)),
      id: row.id,
      ref: row.ref,
      kind: row.kind,
      revision: row.revision,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
  list(actor, kind) {
    demand(kinds.includes(kind), "Unknown master type.", 404);
    return this.db
      .prepare("SELECT * FROM records WHERE kind=? ORDER BY created_at DESC")
      .all(kind)
      .map((row) => this.readRecord(row));
  }
  detail(actor, kind, id, sensitive = false) {
    const row = this.db
      .prepare("SELECT * FROM records WHERE id=? AND kind=?")
      .get(id, kind);
    demand(row, "Record not found.", 404);
    if (sensitive) {
      this.audit(
        actor,
        "Restricted details viewed",
        id,
        row.society_id || (kind === "societies" ? id : null),
      );
    }
    return this.readRecord(row, sensitive);
  }
  nextNumber(kind) {
    const key = `master:${kind}`;
    const row = this.db
      .prepare(
        "INSERT INTO series(key,value) VALUES(?,1) ON CONFLICT(key) DO UPDATE SET value=value+1 RETURNING value",
      )
      .get(key);
    return `${prefixes[kind]}-${String(row.value).padStart(6, "0")}`;
  }
  save(actor, kind, id, raw) {
    const reason = id ? text(raw.reason, "Reason for change", true, 1000) : "";
    const data = validate(kind, raw);
    return this.transaction(() => {
      const old = id
        ? this.db
            .prepare("SELECT * FROM records WHERE id=? AND kind=?")
            .get(id, kind)
        : null;
      if (id) {
        demand(old, "Record not found.", 404);
        demand(
          raw.revision === old.revision,
          "This record changed since you opened it. Reload before saving.",
          409,
        );
        const before = decrypt(old.payload, this.key);
        if (
          kind === "banks" &&
          this.db
            .prepare("SELECT 1 FROM bank_entries WHERE bank_id=? LIMIT 1")
            .get(id)
        ) {
          demand(
            data.openingBalance === before.openingBalance &&
              data.openingDate === before.openingDate &&
              data.accountNumber === before.accountNumber,
            "Bank opening balance, date and account number are locked after posting receipts.",
          );
        }
        demand(
          !data.societyId || data.societyId === old.society_id,
          "A record cannot be moved to another Society.",
        );
        if (kind === "societies")
          demand(data.code === before.code, "Society code is immutable.");
      }
      if (data.societyId) {
        const society = this.db
          .prepare("SELECT * FROM records WHERE id=? AND kind='societies'")
          .get(data.societyId);
        demand(society, "Select an existing Society.");
        demand(
          society.status === "Active" || (old && data.status === "Inactive"),
          "Reactivate the Society before creating or editing active records.",
        );
      }
      if (data.departmentId)
        demand(
          this.db
            .prepare(
              "SELECT id FROM records WHERE id=? AND kind='departments' AND status='Active'",
            )
            .get(data.departmentId),
          "Select an active department.",
        );
      const siblings = this.db
        .prepare("SELECT * FROM records WHERE kind=?")
        .all(kind)
        .filter((r) => r.id !== id);
      for (const sibling of siblings) {
        const other = decrypt(sibling.payload, this.key);
        if (kind === "societies")
          demand(other.code !== data.code, "Society code already exists.", 409);
        if (kind === "projects")
          demand(
            !(
              other.societyId === data.societyId &&
              other.departmentId === data.departmentId &&
              other.workOrder.toLowerCase() === data.workOrder.toLowerCase()
            ),
            "This work order already exists for this Society and department.",
            409,
          );
        if (kind === "banks")
          demand(
            !(
              other.societyId === data.societyId &&
              other.accountNumber === data.accountNumber
            ),
            "This bank account is already registered for this Society.",
            409,
          );
        if (
          kind === "beneficiaries" &&
          data.accountNumber &&
          other.societyId === data.societyId &&
          other.accountNumber === data.accountNumber
        )
          demand(
            data.sharedAccountReason.length >= 10,
            "This account is shared with another beneficiary. Enter a documented reason of at least 10 characters.",
            409,
          );
        if (
          other.name.toLowerCase() === data.name.toLowerCase() &&
          (other.societyId || "") === (data.societyId || "")
        )
          demand(
            text(
              raw.duplicateReason,
              "Duplicate-name justification",
              false,
              1000,
            ).length >= 10,
            "A record with this name already exists. Enter a duplicate-name reason of at least 10 characters.",
            409,
          );
      }
      const recordId = id || randomUUID(),
        ref = old?.ref || this.nextNumber(kind),
        now = new Date().toISOString();
      this.db
        .prepare(
          `INSERT INTO records(id,kind,ref,name,society_id,department_id,status,payload,revision,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,1,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,department_id=excluded.department_id,status=excluded.status,payload=excluded.payload,revision=records.revision+1,updated_at=excluded.updated_at`,
        )
        .run(
          recordId,
          kind,
          ref,
          data.name,
          data.societyId || null,
          data.departmentId || null,
          data.status,
          encrypt(data, this.key),
          now,
          now,
        );
      this.audit(
        actor,
        id ? "Master updated" : "Master created",
        recordId,
        data.societyId || (kind === "societies" ? recordId : null),
        [reason, raw.duplicateReason || "", data.sharedAccountReason || ""]
          .filter(Boolean)
          .join("; "),
        old ? decrypt(old.payload, this.key) : null,
        data,
      );
      return this.readRecord(
        this.db.prepare("SELECT * FROM records WHERE id=?").get(recordId),
      );
    });
  }
  auditList(actor, entityId) {
    const rows = entityId
      ? this.db
          .prepare("SELECT * FROM audit WHERE entity_id=? ORDER BY id DESC")
          .all(entityId)
      : this.db.prepare("SELECT * FROM audit ORDER BY id DESC").all();
    return rows.slice(0, 250).map((r) => ({
      id: r.id,
      actor: r.actor_name,
      action: r.action,
      entityId: r.entity_id,
      at: r.at,
      reason: r.reason,
      before: r.before_json ? redact(decrypt(r.before_json, this.key)) : null,
      after: r.after_json ? redact(decrypt(r.after_json, this.key)) : null,
    }));
  }
  numbering(actor) {
    return {
      year: financialYear(),
      masters: this.db.prepare("SELECT * FROM series ORDER BY key").all(),
      receiptPreview: `LSP-[Society code]-${financialYear()}-000001`,
      outwardPreview: `OUT-${financialYear()}-000001`,
    };
  }
}
Object.assign(Store.prototype, receiptMethods);
Object.assign(Store.prototype, paymentMethods);
