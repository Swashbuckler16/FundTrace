import { randomUUID, createHash } from "node:crypto";
import { text, date, money, demand } from "./domain.mjs";
import { encrypt, decrypt } from "./security.mjs";

export function initializeReconciliation(store) {
  store.db.exec(`BEGIN IMMEDIATE;
    CREATE TABLE IF NOT EXISTS statement_imports(id TEXT PRIMARY KEY,bank_id TEXT NOT NULL REFERENCES records(id),payload TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS statement_lines(id TEXT PRIMARY KEY,import_id TEXT NOT NULL REFERENCES statement_imports(id),bank_id TEXT NOT NULL REFERENCES records(id),fingerprint TEXT NOT NULL,payload TEXT NOT NULL,UNIQUE(bank_id,fingerprint));
    CREATE TABLE IF NOT EXISTS reconciliation_links(id TEXT PRIMARY KEY,line_id TEXT NOT NULL REFERENCES statement_lines(id),movement_key TEXT NOT NULL,amount INTEGER NOT NULL CHECK(amount>0),created_at TEXT NOT NULL,voided_at TEXT);
    CREATE TABLE IF NOT EXISTS reconciliation_exceptions(id TEXT PRIMARY KEY,line_id TEXT NOT NULL REFERENCES statement_lines(id),payload TEXT NOT NULL,revision INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS bank_movements(id TEXT PRIMARY KEY,ref TEXT UNIQUE NOT NULL,bank_id TEXT NOT NULL REFERENCES records(id),reversal_of TEXT UNIQUE REFERENCES bank_movements(id),payload TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS period_locks(id TEXT PRIMARY KEY,bank_id TEXT NOT NULL REFERENCES records(id),start_date TEXT NOT NULL,end_date TEXT NOT NULL,status TEXT NOT NULL,payload TEXT NOT NULL,revision INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS reconciliation_line_links ON reconciliation_links(line_id);
    CREATE INDEX IF NOT EXISTS reconciliation_movement_links ON reconciliation_links(movement_key);
    COMMIT;`);
  for (const table of [
    "statement_imports",
    "statement_lines",
    "bank_movements",
  ]) {
    for (const operation of ["UPDATE", "DELETE"])
      store.db.exec(
        `CREATE TRIGGER IF NOT EXISTS ${table}_no_${operation.toLowerCase()} BEFORE ${operation} ON ${table} BEGIN SELECT RAISE(ABORT,'Financial evidence is immutable'); END;`,
      );
  }
  for (const table of [
    "reconciliation_links",
    "reconciliation_exceptions",
    "period_locks",
  ])
    store.db.exec(
      `CREATE TRIGGER IF NOT EXISTS ${table}_no_delete BEFORE DELETE ON ${table} BEGIN SELECT RAISE(ABORT,'Financial history cannot be deleted'); END;`,
    );
}
export function confirmed(raw) {
  demand(raw.confirm === true, "Explicit local confirmation is required.");
}
export function documentedReason(raw) {
  const reason = text(raw.reason, "Reason", true, 1000);
  demand(reason.length >= 10, "Reason must contain at least 10 characters.");
  return reason;
}
export function activeBank(store, id) {
  const row = store.db
    .prepare(
      "SELECT * FROM records WHERE kind='banks' AND id=? AND status='Active'",
    )
    .get(id);
  demand(row, "Select an active bank account.");
  return store.readRecord(row, true);
}
function signedMoney(value, label) {
  demand(value != null && value !== "", `${label} is required.`);
  const s = String(value);
  return s.startsWith("-") ? -money(s.slice(1), label) : money(s, label);
}
function sum(values) {
  const total = values.reduce((a, b) => a + b, 0);
  demand(Number.isSafeInteger(total), "Amount exceeds the supported range.");
  return total;
}
function unpack(store, row) {
  demand(row, "Record not found.", 404);
  return {
    ...decrypt(row.payload, store.key),
    id: row.id,
    ...(row.revision ? { revision: row.revision } : {}),
  };
}
function normalizeImport(store, raw) {
  const bank = activeBank(store, text(raw.bankId, "Bank account", true));
  const start = date(raw.start, "Statement start", true),
    end = date(raw.end, "Statement end", true);
  demand(
    start <= end && start >= bank.openingDate,
    "Statement dates must be ordered and on or after the bank opening date.",
  );
  store.assertPeriodOpen(bank.id, start);
  demand(
    Array.isArray(raw.rows) && raw.rows.length > 0 && raw.rows.length <= 2000,
    "Import between 1 and 2,000 statement rows.",
  );
  const opening = signedMoney(raw.opening, "Statement opening"),
    closing = signedMoney(raw.closing, "Statement closing");
  let running = opening,
    previous = start;
  const seen = new Set();
  const rows = raw.rows.map((r, index) => {
    demand(r && typeof r === "object", "Invalid statement row.");
    const day = date(r.date, `Row ${index + 1} date`, true),
      valueDate = date(r.valueDate || r.date, "Value date", true);
    demand(
      day >= previous && day <= end,
      `Row ${index + 1}: sort dates ascending and keep them inside the statement period.`,
    );
    previous = day;
    const debit = money(
        r.debit === "" || r.debit == null ? "0" : r.debit,
        "Debit",
      ),
      credit = money(
        r.credit === "" || r.credit == null ? "0" : r.credit,
        "Credit",
      );
    demand(
      debit > 0 !== credit > 0,
      `Row ${index + 1}: enter exactly one positive debit or credit.`,
    );
    const amount = credit - debit,
      reference = text(r.reference, "Bank reference", false, 240),
      narration = text(r.narration, "Narration", false, 1000);
    demand(
      reference || narration,
      `Row ${index + 1}: a reference or narration is required.`,
    );
    running = sum([running, amount]);
    if (r.balance !== "" && r.balance != null)
      demand(
        signedMoney(r.balance, "Balance") === running,
        `Row ${index + 1}: running balance does not agree with the statement opening and movements.`,
      );
    const data = {
      date: day,
      valueDate,
      amount,
      reference,
      narration,
      balance: running,
    };
    const fingerprint = createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex");
    demand(
      !seen.has(fingerprint),
      `Row ${index + 1}: duplicate line within this import.`,
    );
    seen.add(fingerprint);
    const duplicate = !!store.db
      .prepare(
        "SELECT id FROM statement_lines WHERE bank_id=? AND fingerprint=?",
      )
      .get(bank.id, fingerprint);
    return { ...data, fingerprint, duplicate };
  });
  demand(
    running === closing,
    "Statement closing balance does not equal opening plus credits minus debits.",
  );
  return {
    bankId: bank.id,
    societyId: bank.societyId,
    start,
    end,
    opening,
    closing,
    rows,
    sourceName: text(raw.sourceName, "Source name", true, 160),
  };
}
export const reconciliationMethods = {
  hasBankHistory(id) {
    return !!(
      this.db
        .prepare("SELECT 1 FROM bank_entries WHERE bank_id=? LIMIT 1")
        .get(id) ||
      this.db
        .prepare("SELECT 1 FROM bank_movements WHERE bank_id=? LIMIT 1")
        .get(id) ||
      this.db
        .prepare("SELECT 1 FROM statement_lines WHERE bank_id=? LIMIT 1")
        .get(id) ||
      this.db
        .prepare(
          "SELECT 1 FROM period_locks WHERE bank_id=? AND status='Locked' LIMIT 1",
        )
        .get(id)
    );
  },
  assertPeriodOpen(bankId, day) {
    demand(
      !this.db
        .prepare(
          "SELECT id FROM period_locks WHERE bank_id=? AND status='Locked' AND end_date>=? LIMIT 1",
        )
        .get(bankId, day),
      "This bank period is locked. Reopen it with a reason before changing this date or an earlier balance.",
      409,
    );
  },
  assertTaxPeriodOpen(societyId, day) {
    demand(
      !this.db
        .prepare(
          "SELECT l.id FROM period_locks l JOIN records b ON b.id=l.bank_id WHERE b.society_id=? AND l.status='Locked' AND l.end_date>=? LIMIT 1",
        )
        .get(societyId, day),
      "A bank period for this Society is locked. Reopen it before changing historical tax records.",
      409,
    );
  },
  previewStatement(raw) {
    const data = normalizeImport(this, raw);
    const overlaps = this.statementImports().some(
      (s) =>
        s.bankId === data.bankId && s.start <= data.end && s.end >= data.start,
    );
    return {
      ...data,
      overlaps,
      duplicates: data.rows.filter((r) => r.duplicate).length,
    };
  },
  importStatement(actor, raw) {
    return this.transaction(() => {
      confirmed(raw);
      const { overlaps, duplicates, ...data } = this.previewStatement(raw);
      demand(
        !overlaps,
        "This statement period overlaps an existing import for this bank. Import a separate consecutive period instead.",
        409,
      );
      demand(
        !data.rows.some((r) => r.duplicate),
        "This import overlaps existing statement lines. Remove already imported lines and correct the opening balance before importing.",
        409,
      );
      const source = text(raw.sourceData, "Source evidence", true, 3000000);
      demand(
        /^[A-Za-z0-9+/]*={0,2}$/.test(source),
        "Source evidence must be base64.",
      );
      const bytes = Buffer.from(source, "base64");
      demand(
        bytes.length > 0 && bytes.length <= 2 * 1024 * 1024,
        "Statement evidence must be between 1 byte and 2 MB.",
      );
      const id = randomUUID(),
        now = new Date().toISOString(),
        { rows, ...header } = data;
      this.db.prepare("INSERT INTO statement_imports VALUES(?,?,?,?)").run(
        id,
        data.bankId,
        encrypt(
          {
            ...header,
            sourceData: source,
            sourceHash: createHash("sha256").update(bytes).digest("hex"),
            enteredAt: now,
          },
          this.key,
        ),
        now,
      );
      for (const { fingerprint, duplicate, ...line } of rows)
        this.db
          .prepare("INSERT INTO statement_lines VALUES(?,?,?,?,?)")
          .run(
            randomUUID(),
            id,
            data.bankId,
            fingerprint,
            encrypt(line, this.key),
          );
      this.audit(
        actor,
        "Bank statement imported",
        id,
        data.societyId,
        "",
        null,
        { ...header, rowCount: rows.length },
      );
      return this.statementImport(id);
    });
  },
  statementImports() {
    return this.db
      .prepare("SELECT * FROM statement_imports ORDER BY created_at DESC")
      .all()
      .map((r) => {
        const { sourceData, ...data } = unpack(this, r);
        return data;
      });
  },
  statementImport(id) {
    const row = this.db
      .prepare("SELECT * FROM statement_imports WHERE id=?")
      .get(id);
    const { sourceData, ...data } = unpack(this, row);
    return {
      ...data,
      lines: this.statementLines(row.bank_id).filter((l) => l.importId === id),
    };
  },
  statementSource(id) {
    const data = unpack(
      this,
      this.db.prepare("SELECT * FROM statement_imports WHERE id=?").get(id),
    );
    return { name: data.sourceName, data: data.sourceData };
  },
  statementLines(bankId) {
    const rows = bankId
      ? this.db
          .prepare("SELECT * FROM statement_lines WHERE bank_id=?")
          .all(bankId)
      : this.db.prepare("SELECT * FROM statement_lines").all();
    return rows
      .map((row) => {
        const data = unpack(this, row),
          links = this.db
            .prepare(
              "SELECT * FROM reconciliation_links WHERE line_id=? AND voided_at IS NULL",
            )
            .all(row.id),
          matched = sum(links.map((l) => l.amount));
        const exceptions = this.db
          .prepare("SELECT * FROM reconciliation_exceptions WHERE line_id=?")
          .all(row.id)
          .map((e) => unpack(this, e));
        return {
          ...data,
          bankId: row.bank_id,
          importId: row.import_id,
          links,
          matched,
          remaining: Math.abs(data.amount) - matched,
          exceptions,
          status: exceptions.some((e) => e.status === "Open")
            ? "Exception"
            : matched === Math.abs(data.amount)
              ? "Matched"
              : matched
                ? "Partially matched"
                : "Unmatched",
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  },
  statementLine(id) {
    const row = this.db
      .prepare("SELECT bank_id FROM statement_lines WHERE id=?")
      .get(id);
    demand(row, "Statement line not found.", 404);
    return this.statementLines(row.bank_id).find((r) => r.id === id);
  },
  reconciliationMovements(bankId) {
    const book = this.bankBook().find((b) => b.bank.id === bankId);
    demand(book, "Bank account not found.", 404);
    return book.entries.map((e) => {
      const matched = this.db
        .prepare(
          "SELECT COALESCE(SUM(amount),0) AS n FROM reconciliation_links WHERE movement_key=? AND voided_at IS NULL",
        )
        .get(e.movement_key).n;
      return { ...e, bankId, matched, remaining: Math.abs(e.amount) - matched };
    });
  },
  matchStatement(actor, lineId, raw) {
    return this.transaction(() => {
      confirmed(raw);
      const line = this.statementLine(lineId);
      this.assertPeriodOpen(line.bankId, line.date);
      demand(
        Array.isArray(raw.matches) &&
          raw.matches.length > 0 &&
          raw.matches.length <= 100,
        "Select between 1 and 100 matching bank movements.",
      );
      const seen = new Set(),
        movements = this.reconciliationMovements(line.bankId);
      const matches = raw.matches.map((r) => {
        const key = text(r.movementKey, "Movement", true),
          amount = money(r.amount, "Match amount");
        demand(
          amount > 0 && !seen.has(key),
          "Match amounts must be positive and movement selections unique.",
        );
        seen.add(key);
        const movement = movements.find((m) => m.movement_key === key);
        demand(
          movement && Math.sign(movement.amount) === Math.sign(line.amount),
          "Match a movement from this bank with the same credit/debit direction.",
        );
        this.assertPeriodOpen(line.bankId, movement.credit_date);
        demand(
          amount <= movement.remaining,
          "Match exceeds the unmatched bank movement amount.",
          409,
        );
        return { key, amount, movement };
      });
      demand(
        sum(matches.map((m) => m.amount)) <= line.remaining,
        "Match exceeds the unmatched statement amount.",
        409,
      );
      const differences = matches.some(
        (m) =>
          m.movement.credit_date !== line.date ||
          !line.reference ||
          line.reference.toUpperCase() !==
            (m.movement.reference || "").toUpperCase(),
      );
      const reason = differences
        ? documentedReason(raw)
        : text(raw.reason, "Reason", false, 1000);
      for (const m of matches)
        this.db
          .prepare("INSERT INTO reconciliation_links VALUES(?,?,?,?,?,NULL)")
          .run(randomUUID(), lineId, m.key, m.amount, new Date().toISOString());
      this.audit(
        actor,
        "Statement matched",
        lineId,
        null,
        reason,
        null,
        matches.map(({ key, amount }) => ({ key, amount })),
      );
      return this.statementLine(lineId);
    });
  },
  unmatchStatement(actor, id, raw) {
    return this.transaction(() => {
      confirmed(raw);
      const reason = documentedReason(raw),
        link = this.db
          .prepare(
            "SELECT * FROM reconciliation_links WHERE id=? AND voided_at IS NULL",
          )
          .get(id);
      demand(link, "Active match not found.", 404);
      const line = this.statementLine(link.line_id);
      this.assertPeriodOpen(line.bankId, line.date);
      const movement = this.reconciliationMovements(line.bankId).find(
        (m) => m.movement_key === link.movement_key,
      );
      this.assertPeriodOpen(line.bankId, movement.credit_date);
      this.db
        .prepare("UPDATE reconciliation_links SET voided_at=? WHERE id=?")
        .run(new Date().toISOString(), id);
      this.audit(
        actor,
        "Statement match removed",
        line.id,
        null,
        reason,
        null,
        { matchId: id },
      );
      return this.statementLine(line.id);
    });
  },
  saveException(actor, lineId, raw) {
    return this.transaction(() => {
      confirmed(raw);
      const line = this.statementLine(lineId);
      this.assertPeriodOpen(line.bankId, line.date);
      const reason = documentedReason(raw),
        owner = text(raw.owner, "Owner / follow-up annotation", true),
        id = raw.id || randomUUID();
      const old = raw.id
        ? unpack(
            this,
            this.db
              .prepare(
                "SELECT * FROM reconciliation_exceptions WHERE id=? AND line_id=?",
              )
              .get(id, lineId),
          )
        : null;
      if (old)
        demand(
          raw.revision === old.revision,
          "Exception changed. Reload before saving.",
          409,
        );
      const status = raw.status || "Open";
      demand(
        ["Open", "Resolved"].includes(status),
        "Invalid exception status.",
      );
      const data = {
        reason,
        owner,
        status,
        openedAt: old?.openedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.db
        .prepare(
          "INSERT INTO reconciliation_exceptions VALUES(?,?,?,1) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,revision=reconciliation_exceptions.revision+1",
        )
        .run(id, lineId, encrypt(data, this.key));
      this.audit(
        actor,
        `Reconciliation exception ${status.toLowerCase()}`,
        lineId,
        null,
        reason,
        old,
        data,
      );
      return this.statementLine(lineId);
    });
  },
  otherMovements() {
    return this.db
      .prepare("SELECT * FROM bank_movements ORDER BY created_at DESC")
      .all()
      .map((row) => ({
        ...unpack(this, row),
        ref: row.ref,
        bankId: row.bank_id,
        reversalOf: row.reversal_of,
        createdAt: row.created_at,
      }));
  },
  saveBankMovement(actor, raw) {
    return this.transaction(() => {
      confirmed(raw);
      const bank = activeBank(this, text(raw.bankId, "Bank account", true)),
        day = date(raw.date, "Date", true),
        reason = documentedReason(raw),
        reference = text(raw.reference, "Bank evidence reference", true);
      demand(day >= bank.openingDate, "Movement precedes bank opening date.");
      this.assertPeriodOpen(bank.id, day);
      const category = text(raw.category, "Category", true);
      demand(
        ["Bank charge", "Interest", "Other debit", "Other credit"].includes(
          category,
        ),
        "Select a movement category.",
      );
      let amount = money(raw.amount, "Amount");
      demand(amount > 0, "Amount must be positive.");
      if (["Bank charge", "Other debit"].includes(category)) amount = -amount;
      let reversalOf = null;
      if (raw.reversalOf) {
        const original = this.otherMovements().find(
          (m) => m.id === raw.reversalOf,
        );
        demand(
          original && original.bankId === bank.id && !original.reversalOf,
          "Select an original movement in this bank.",
        );
        demand(
          !this.db
            .prepare("SELECT id FROM bank_movements WHERE reversal_of=?")
            .get(original.id),
          "This movement is already reversed.",
          409,
        );
        demand(
          day >= original.date && amount === -original.amount,
          "A reversal must exactly offset its original on the same or a later date.",
        );
        reversalOf = original.id;
      }
      demand(
        !this.otherMovements().some(
          (m) =>
            m.bankId === bank.id &&
            m.reference.toUpperCase() === reference.toUpperCase(),
        ),
        "This adjustment reference already exists for this bank.",
        409,
      );
      this.assertBankMovement(bank.id, day, amount);
      const id = randomUUID(),
        ref = this.nextFinancialRef("ADJ"),
        data = {
          date: day,
          amount,
          category,
          reason,
          reference,
          societyId: bank.societyId,
        };
      this.db
        .prepare("INSERT INTO bank_movements VALUES(?,?,?,?,?,?)")
        .run(
          id,
          ref,
          bank.id,
          reversalOf,
          encrypt(data, this.key),
          new Date().toISOString(),
        );
      this.audit(
        actor,
        "Bank adjustment posted",
        id,
        bank.societyId,
        reason,
        null,
        { ...data, ref, reversalOf },
      );
      return this.otherMovements().find((m) => m.id === id);
    });
  },
  periods() {
    return this.db
      .prepare("SELECT * FROM period_locks ORDER BY end_date DESC")
      .all()
      .map((row) => ({
        ...unpack(this, row),
        bankId: row.bank_id,
        start: row.start_date,
        end: row.end_date,
        status: row.status,
      }));
  },
  lockPeriod(actor, raw) {
    return this.transaction(() => {
      confirmed(raw);
      const bank = activeBank(this, text(raw.bankId, "Bank account", true)),
        start = date(raw.start, "Start", true),
        end = date(raw.end, "End", true),
        reason = documentedReason(raw);
      demand(
        start <= end && start >= bank.openingDate,
        "Choose a valid bank period.",
      );
      demand(
        !this.db
          .prepare(
            "SELECT id FROM period_locks WHERE bank_id=? AND status='Locked' AND start_date<=? AND end_date>=?",
          )
          .get(bank.id, end, start),
        "This period overlaps an existing lock.",
        409,
      );
      const lines = this.statementLines(bank.id).filter(
          (l) => l.date >= start && l.date <= end,
        ),
        movements = this.reconciliationMovements(bank.id).filter(
          (m) => m.credit_date >= start && m.credit_date <= end,
        );
      demand(
        lines.length > 0,
        "Import statement evidence before locking this period.",
      );
      demand(
        lines.every((l) => l.status === "Matched"),
        "Resolve exceptions and fully match every statement line before locking.",
      );
      demand(
        movements.every((m) => m.remaining === 0),
        "Every bank-book movement in the period must be fully matched.",
      );
      const imports = this.statementImports()
        .filter((s) => s.bankId === bank.id && s.start >= start && s.end <= end)
        .sort((a, b) => a.start.localeCompare(b.start));
      demand(
        imports.length > 0 &&
          imports[0].start === start &&
          imports.at(-1).end === end,
        "Statement imports must cover the exact lock period.",
      );
      for (let i = 1; i < imports.length; i++) {
        const next = new Date(imports[i - 1].end + "T00:00:00Z");
        next.setUTCDate(next.getUTCDate() + 1);
        demand(
          imports[i].start === next.toISOString().slice(0, 10) &&
            imports[i].opening === imports[i - 1].closing,
          "Statement periods must be contiguous, non-overlapping and carry forward the closing balance.",
        );
      }
      const entries = this.bankBook().find(
        (b) => b.bank.id === bank.id,
      ).entries;
      const opening = sum([
          bank.openingBalance,
          ...entries.filter((e) => e.credit_date < start).map((e) => e.amount),
        ]),
        closing = sum([
          bank.openingBalance,
          ...entries.filter((e) => e.credit_date <= end).map((e) => e.amount),
        ]);
      demand(
        opening === imports[0].opening && closing === imports.at(-1).closing,
        "Statement opening/closing balances do not agree with the bank book.",
      );
      const id = randomUUID();
      this.db
        .prepare("INSERT INTO period_locks VALUES(?,?,?,?,'Locked',?,1)")
        .run(
          id,
          bank.id,
          start,
          end,
          encrypt(
            { reason, opening, closing, lockedAt: new Date().toISOString() },
            this.key,
          ),
        );
      this.audit(
        actor,
        "Bank period locked",
        id,
        bank.societyId,
        reason,
        null,
        { start, end, opening, closing },
      );
      return this.periods().find((p) => p.id === id);
    });
  },
  reopenPeriod(actor, id, raw) {
    return this.transaction(() => {
      confirmed(raw);
      const reason = documentedReason(raw),
        period = this.periods().find((p) => p.id === id);
      demand(period?.status === "Locked", "Locked period not found.", 404);
      demand(
        raw.revision === period.revision,
        "Period changed. Reload before reopening.",
        409,
      );
      demand(
        !this.periods().some(
          (p) =>
            p.bankId === period.bankId &&
            p.status === "Locked" &&
            p.end > period.end,
        ),
        "Reopen later locked periods first.",
      );
      this.db
        .prepare(
          "UPDATE period_locks SET status='Reopened',revision=revision+1 WHERE id=?",
        )
        .run(id);
      this.audit(actor, "Bank period reopened", id, null, reason, null, {
        start: period.start,
        end: period.end,
      });
      return this.periods().find((p) => p.id === id);
    });
  },
};
