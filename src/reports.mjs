import { demand, date, money, text, kinds } from "./domain.mjs";

export const reportCatalog = {
  receipts: "Government receipt register",
  payments: "All beneficiary payments",
  supplier: "Supplier payment register",
  subcontractor: "Sub-contractor payment register",
  labour: "Labour payment register",
  utilisation: "Receipt utilisation",
  pending: "Claim pending",
  projects: "Project financial summary",
  reconciliation: "Bank reconciliation",
  tax: "Tax credit register",
  summary: "Society monthly / yearly summary",
};
export const todayIndia = () =>
  new Date(Date.now() + 19800000).toISOString().slice(0, 10);
const total = (values) => {
  const result = values.reduce((a, b) => a + b, 0);
  demand(
    Number.isSafeInteger(result),
    "Report total exceeds the supported monetary range.",
  );
  return result;
};
function filters(raw, defaultPeriod = "fy") {
  const today = todayIndia(),
    period = text(raw.period || defaultPeriod, "Period");
  demand(
    ["all", "fy", "month", "custom"].includes(period),
    "Select a valid reporting period.",
  );
  let from = "",
    to = "",
    label = "All dates";
  const year = text(
    raw.year ||
      String(
        Number(today.slice(0, 4)) - (Number(today.slice(5, 7)) < 4 ? 1 : 0),
      ),
    "Financial year",
  );
  demand(
    /^\d{4}$/.test(year) && +year >= 1900 && +year <= 9998,
    "Enter a financial-year start between 1900 and 9998.",
  );
  const month = text(raw.month || today.slice(0, 7), "Month");
  date(`${month}-01`, "Month", true);
  if (period === "fy") {
    from = `${year}-04-01`;
    to = `${+year + 1}-03-31`;
    label = `FY ${year}–${+year + 1}`;
  }
  if (period === "month") {
    from = `${month}-01`;
    const d = new Date(from);
    d.setUTCMonth(d.getUTCMonth() + 1);
    d.setUTCDate(0);
    to = d.toISOString().slice(0, 10);
    label = month;
  }
  if (period === "custom") {
    from = date(raw.from, "From", true);
    to = date(raw.to, "To", true);
    demand(from <= to, "From must not follow To.");
    label = `${from} to ${to}`;
  }
  const result = { period, year, month, from, to, label };
  for (const key of [
    "society",
    "department",
    "project",
    "bank",
    "beneficiary",
    "category",
    "status",
    "reconciliation",
    "q",
  ])
    result[key] = text(raw[key], key, false);
  for (const key of ["min", "max"])
    result[key] =
      raw[key] == null || raw[key] === "" ? null : money(raw[key], key);
  demand(
    result.min == null || result.max == null || result.min <= result.max,
    "Minimum amount must not exceed maximum.",
  );
  return result;
}
const inPeriod = (day, f) =>
  (!f.from || day >= f.from) && (!f.to || day <= f.to);
function paymentCategories(movements, claims) {
  const totals = { supplier: 0, subcontractor: 0, labour: 0 };
  for (const movement of movements.filter((m) => m.page === "payments"))
    for (const row of movement.source.distributions) {
      const category = claims.get(row.claimId).category;
      const key =
        category === "Supplier"
          ? "supplier"
          : category === "Sub-contractor"
            ? "subcontractor"
            : "labour";
      totals[key] = total([
        totals[key],
        -Math.sign(movement.amount) * row.amount,
      ]);
    }
  return totals;
}
function snapshot(store, actor, fn) {
  // ponytail: reuse local register readers; index/paginate storage if Phase 6 volume profiling requires it.
  store.db.exec("BEGIN");
  try {
    const masters = Object.fromEntries(
      kinds.map((k) => [k, store.list(actor, k)]),
    );
    const records = new Map(
      Object.values(masters)
        .flat()
        .map((r) => [r.id, r]),
    );
    const receipts = store.receipts(),
      payments = store.payments(),
      claims = store.claims(),
      taxes = store.taxes();
    const receiptMap = new Map(receipts.map((r) => [r.id, r])),
      paymentMap = new Map(payments.map((p) => [p.id, p])),
      claimMap = new Map(claims.map((c) => [c.id, c]));
    const adjustments = new Map(store.otherMovements().map((m) => [m.id, m]));
    const books = store.bankBook(actor),
      lines = store.statementLines();
    const linked = new Map();
    for (const line of lines)
      for (const link of line.links) {
        if (!linked.has(link.movement_key)) linked.set(link.movement_key, []);
        linked.get(link.movement_key).push({ line, amount: link.amount });
      }
    const name = (id) => records.get(id)?.name || "";
    const common = (r) => ({
      societyId: r.societyId,
      projectId: r.projectId || "",
      bankId: r.bankId || "",
      departmentId:
        r.departmentId || records.get(r.projectId)?.departmentId || "",
      society: name(r.societyId),
      project: name(r.projectId),
      projectRef: records.get(r.projectId)?.ref || "",
      department: name(
        r.departmentId || records.get(r.projectId)?.departmentId,
      ),
      bank: name(r.bankId),
      workOrder: records.get(r.projectId)?.workOrder || "",
    });
    const movements = books.flatMap((book) =>
      book.entries.map((e) => {
        const source =
          e.page === "receipts"
            ? receiptMap.get(e.entity_id)
            : e.page === "payments"
              ? paymentMap.get(e.entity_id)
              : adjustments.get(e.entity_id);
        const links = linked.get(e.movement_key) || [],
          matched = total(links.map((l) => l.amount));
        return {
          ...common(source),
          ...e,
          date: e.credit_date,
          matched,
          reconciliation: links.some((l) => l.line.status === "Exception")
            ? "Exception"
            : matched === Math.abs(e.amount)
              ? "Matched"
              : matched
                ? "Partially matched"
                : "Unmatched",
          source,
          adjustmentCategory: source.reversalOf
            ? adjustments.get(source.reversalOf)?.category
            : source.category,
        };
      }),
    );
    const result = fn({
      masters,
      records,
      receipts,
      payments,
      claims,
      taxes,
      receiptMap,
      paymentMap,
      claimMap,
      books,
      lines,
      linked,
      name,
      common,
      movements,
    });
    store.db.exec("COMMIT");
    return result;
  } catch (e) {
    store.db.exec("ROLLBACK");
    throw e;
  }
}
function scoped(row, f) {
  return (
    ["society", "department", "project", "bank", "beneficiary"].every(
      (k) => !f[k] || row[`${k}Id`] === f[k],
    ) &&
    (!f.category || row.category === f.category) &&
    (!f.status || row.status === f.status) &&
    (!f.reconciliation || row.reconciliation === f.reconciliation) &&
    (f.min == null || Math.abs(row.amount ?? 0) >= f.min) &&
    (f.max == null || Math.abs(row.amount ?? 0) <= f.max) &&
    (!f.q ||
      Object.entries(row)
        .filter(
          ([key, value]) =>
            typeof value === "string" &&
            !key.startsWith("_") &&
            ![
              "societyId",
              "departmentId",
              "projectId",
              "bankId",
              "beneficiaryId",
            ].includes(key),
        )
        .map(([, value]) => value)
        .join(" ")
        .toLowerCase()
        .includes(f.q.toLowerCase()))
  );
}
const col = (key, label, type = "text") => ({ key, label, type });
const moneyCol = (key, label) => col(key, label, "money");
const identity = [
  col("society", "Society"),
  col("project", "Project"),
  col("workOrder", "Work order"),
];
const currentNotice =
  "Balances, utilisation, claim pending and tax positions are CURRENT at generation, not historical snapshots. Period filters select the source records; cash movements use their own bank dates.";
function validateScope(s, f) {
  for (const [filter, kind] of [
    ["society", "societies"],
    ["department", "departments"],
    ["project", "projects"],
    ["bank", "banks"],
    ["beneficiary", "beneficiaries"],
  ])
    demand(
      !f[filter] || s.masters[kind].some((r) => r.id === f[filter]),
      `Unknown ${filter} filter.`,
    );
}
export function report(store, actor, raw = {}) {
  const type = text(raw.type || "summary", "Report type");
  demand(Object.hasOwn(reportCatalog, type), "Unknown report.", 404);
  const f = filters(raw);
  return snapshot(store, actor, (s) => {
    validateScope(s, f);
    let rows = [],
      columns = [],
      sumKeys = [],
      notes = currentNotice,
      metrics = {},
      pendingClaims = 0,
      exceptions = 0;
    const cash = s.movements.filter((m) => inPeriod(m.date, f));
    if (type === "summary") {
      demand(
        ![
          "department",
          "project",
          "beneficiary",
          "category",
          "status",
          "reconciliation",
          "q",
        ].some((k) => f[k]) &&
          f.min == null &&
          f.max == null,
        "Bank summaries support Society, bank and period filters only.",
      );
      rows = s.books
        .filter(
          (b) =>
            (!f.society || b.bank.societyId === f.society) &&
            (!f.bank || b.bank.id === f.bank) &&
            (!f.to || b.bank.openingDate <= f.to),
        )
        .map((b) => {
          const entries = s.movements.filter((m) => m.bankId === b.bank.id),
            selected = entries.filter((m) => inPeriod(m.date, f));
          const opening = total([
            b.bank.openingBalance,
            ...entries
              .filter((m) => f.from && m.date < f.from)
              .map((m) => m.amount),
          ]);
          const credits = total(
              selected.filter((m) => m.amount > 0).map((m) => m.amount),
            ),
            debits = total(
              selected.filter((m) => m.amount < 0).map((m) => -m.amount),
            );
          const receiptNet = total(
            selected.filter((m) => m.page === "receipts").map((m) => m.amount),
          );
          const categories = paymentCategories(selected, s.claimMap);
          const other = total(
            selected
              .filter((m) => m.page === "bankmovements")
              .map((m) => m.amount),
          );
          return {
            society: s.name(b.bank.societyId),
            bank: b.bank.name,
            account: b.bank.accountNumber,
            openingDate: b.bank.openingDate,
            opening,
            credits,
            debits,
            receiptNet,
            ...categories,
            other,
            otherCredits: total(
              selected
                .filter((m) => m.page === "bankmovements" && m.amount > 0)
                .map((m) => m.amount),
            ),
            otherDebits: total(
              selected
                .filter((m) => m.page === "bankmovements" && m.amount < 0)
                .map((m) => -m.amount),
            ),
            bankCharges: total(
              selected
                .filter(
                  (m) =>
                    m.page === "bankmovements" &&
                    m.adjustmentCategory === "Bank charge",
                )
                .map((m) => -m.amount),
            ),
            closing: total([opening, credits, -debits]),
            _page: "bankbook",
            _id: "",
          };
        });
      columns = [
        col("society", "Society"),
        col("bank", "Bank"),
        col("account", "Masked account"),
        col("openingDate", "Opening balance effective date", "date"),
        ...[
          "opening",
          "credits",
          "debits",
          "receiptNet",
          "supplier",
          "subcontractor",
          "labour",
          "other",
          "otherCredits",
          "otherDebits",
          "bankCharges",
          "closing",
        ].map((k) =>
          moneyCol(
            k,
            {
              opening: "Opening / initial balance",
              credits: "Total bank credits",
              debits: "Total bank debits",
              receiptNet: "Net Government receipts",
              supplier: "Net supplier payments",
              subcontractor: "Net sub-contractor payments",
              labour: "Net labour payments",
              other: "Net other movements",
              otherCredits: "Other bank credits",
              otherDebits: "Other bank debits (including charges)",
              bankCharges: "Net bank charges (debit breakdown)",
              closing: "Closing bank balance",
            }[k],
          ),
        ),
      ];
      sumKeys = [
        "opening",
        "credits",
        "debits",
        "receiptNet",
        "supplier",
        "subcontractor",
        "labour",
        "other",
        "otherCredits",
        "otherDebits",
        "bankCharges",
        "closing",
      ];
      const taxRecords = s.taxes.filter(
        (t) =>
          (!f.society || t.societyId === f.society) &&
          (!f.bank || s.receiptMap.get(t.receiptId)?.bankId === f.bank),
      );
      pendingClaims = total(
        s.claims
          .filter(
            (c) =>
              c.status === "Approved" &&
              (!f.society || c.societyId === f.society),
          )
          .map((c) => c.pending),
      );
      exceptions = s.lines.filter(
        (l) =>
          (!f.bank || l.bankId === f.bank) &&
          (!f.society || s.records.get(l.bankId)?.societyId === f.society) &&
          l.exceptions.some((e) => e.status === "Open"),
      ).length;
      const taxEvents = taxRecords
        .flatMap((t) => t.events)
        .filter((e) => inPeriod(e.date, f));
      metrics = {
        "Current receipt funds": total(
          s.receipts
            .filter(
              (r) =>
                (!f.society || r.societyId === f.society) &&
                (!f.bank || r.bankId === f.bank),
            )
            .map((r) => r.available),
        ),
        "Current available tax credit (not cash)": total(
          taxRecords.map((t) => t.available),
        ),
        "Period tax credits / adjustments (not cash)": total(
          taxEvents
            .filter((e) =>
              ["Credit", "Adjustment increase", "Adjustment decrease"].includes(
                e.kind,
              ),
            )
            .map((e) =>
              e.kind === "Adjustment decrease" ? -e.amount : e.amount,
            ),
        ),
        "Period tax set-off (not cash)": total(
          taxEvents.filter((e) => e.kind === "Set-off").map((e) => e.amount),
        ),
      };
      notes =
        "Bank credit/debit date basis. Posted originals and reversals are included on their own dates. Credits/debits are actual movements; net category columns include reversals and are breakdowns, not additional cash. Initial balances for accounts opened inside the period are included in Opening / initial balance. Tax uses event dates and is separate from cash; a bank filter includes only tax linked to that bank’s receipts. Current receipt funds and tax positions are as of generation.";
    } else if (type === "receipts") {
      rows = cash
        .filter((m) => m.page === "receipts")
        .map((m) => ({
          ...s.common(m.source),
          date: m.date,
          valueDate: m.source.valueDate,
          paymentId: m.source.paymentId,
          bill: m.source.billNumber,
          mode: m.source.mode,
          reference: m.reference,
          event: m.event,
          status: m.source.status,
          reconciliation: m.reconciliation,
          amount: m.amount,
          _page: "receipts",
          _id: m.source.id,
        }))
        .filter((r) => scoped(r, f));
      columns = [
        ...identity,
        col("department", "Department"),
        col("bank", "Bank"),
        col("paymentId", "Payment ID"),
        col("bill", "Bill"),
        col("date", "Bank movement date", "date"),
        col("valueDate", "Original value date", "date"),
        col("mode", "Mode"),
        col("reference", "Bank reference"),
        col("event", "Movement"),
        moneyCol("amount", "Signed bank credit"),
        col("status", "Current status"),
        col("reconciliation", "Reconciliation"),
      ];
      sumKeys = ["amount"];
    } else if (
      ["payments", "supplier", "subcontractor", "labour"].includes(type)
    ) {
      for (const m of cash.filter((m) => m.page === "payments"))
        for (const d of m.source.distributions) {
          const c = s.claimMap.get(d.claimId),
            category = c.category;
          if (
            (type === "supplier" && category !== "Supplier") ||
            (type === "subcontractor" && category !== "Sub-contractor") ||
            (type === "labour" &&
              !["Individual labourer", "Labour contractor"].includes(category))
          )
            continue;
          rows.push({
            ...s.common(m.source),
            beneficiaryId: c.beneficiaryId,
            beneficiaryPublicId: s.records.get(c.beneficiaryId)?.ref || "",
            beneficiary: s.name(c.beneficiaryId),
            category,
            claim: c.ref,
            invoice: c.reference,
            work: c.description,
            stage: c.stage,
            period: `${c.periodStart || ""} ${c.periodEnd || ""}`.trim(),
            quantity: c.quantity,
            gross: c.gross,
            deductions: total([c.tds, c.retention, c.otherDeduction]),
            net: c.net,
            pending: c.pending,
            receiptIds: m.source.allocations
              .map(
                (a) =>
                  `${s.receiptMap.get(a.receiptId).paymentId}: INR ${(a.amount / 100).toFixed(2)}`,
              )
              .join("; "),
            transaction: m.source.ref,
            date: m.date,
            mode: m.source.mode,
            reference: m.reference,
            event: m.event,
            amount: -Math.sign(m.amount) * d.amount,
            status: m.source.status,
            reconciliation: m.reconciliation,
            _page: "payments",
            _id: m.source.id,
          });
        }
      rows = rows.filter((r) => scoped(r, f));
      columns = [
        ...identity,
        col("beneficiary", "Beneficiary"),
        col("category", "Category"),
        col("claim", "Claim ID"),
        col("invoice", "Invoice / wage reference"),
        col("work", "Work description"),
        col("stage", "RA stage"),
        col("period", "Work period"),
        col("quantity", "Days / quantity"),
        moneyCol("gross", "Claim gross (not additive)"),
        moneyCol("deductions", "Claim deductions (not additive)"),
        moneyCol("net", "Claim net (not additive)"),
        moneyCol("pending", "Current claim pending (not additive)"),
        col(
          "receiptIds",
          "Whole payment source allocations (not beneficiary attribution)",
        ),
        col("transaction", "Transaction ID"),
        col("date", "Bank movement date", "date"),
        col("mode", "Mode"),
        col("reference", "Bank reference"),
        col("event", "Movement"),
        moneyCol("amount", "Signed beneficiary payment"),
        col("status", "Current status"),
      ];
      sumKeys = ["amount"];
      notes +=
        " Each row is one beneficiary distribution, not another whole-bank debit. Claim amounts and whole-payment funding references repeat across instalments and are not totalled. Reversals have negative payment amounts.";
    } else if (type === "utilisation") {
      rows = s.receipts
        .filter((r) => r.paymentId && inPeriod(r.creditDate, f))
        .map((r) => ({
          ...s.common(r),
          paymentId: r.paymentId,
          date: r.creditDate,
          amount: r.amount,
          allocated: r.status === "Posted" ? r.amount - r.available : 0,
          available: r.available,
          utilisation:
            r.status === "Posted"
              ? Number((((r.amount - r.available) * 100) / r.amount).toFixed(2))
              : 0,
          status: r.status,
          _page: "receipts",
          _id: r.id,
        }))
        .filter((r) => scoped(r, f));
      columns = [
        ...identity,
        col("paymentId", "Payment ID"),
        col("date", "Original credit date", "date"),
        moneyCol("amount", "Original received"),
        moneyCol("allocated", "Current allocated"),
        col("utilisation", "Current utilisation %", "number"),
        moneyCol("available", "Current available"),
        col("status", "Current status"),
      ];
      sumKeys = ["allocated", "available"];
    } else if (type === "pending") {
      rows = s.claims
        .filter((c) => c.status === "Approved" && c.pending > 0)
        .map((c) => ({
          ...s.common(c),
          beneficiaryId: c.beneficiaryId,
          beneficiaryPublicId: s.records.get(c.beneficiaryId)?.ref || "",
          beneficiaryRef: s.records.get(c.beneficiaryId)?.ref || "",
          beneficiary: s.name(c.beneficiaryId),
          category: c.category,
          claim: c.ref,
          reference: c.reference,
          date: c.invoiceDate || c.periodEnd || c.createdAt.slice(0, 10),
          gross: c.gross,
          net: c.net,
          paid: c.paid,
          amount: c.pending,
          status: c.settlement,
          _page: "claims",
          _id: c.id,
        }))
        .filter((r) => inPeriod(r.date, f) && scoped(r, f))
        .map((r) => ({
          ...r,
          age: Math.max(
            0,
            Math.floor(
              (Date.parse(todayIndia()) - Date.parse(r.date)) / 86400000,
            ),
          ),
        }));
      columns = [
        ...identity,
        col("beneficiary", "Beneficiary"),
        col("category", "Category"),
        col("claim", "Claim"),
        col("reference", "Invoice / claim reference"),
        col("date", "Invoice / work end / creation date", "date"),
        moneyCol("gross", "Gross"),
        moneyCol("net", "Approved net"),
        moneyCol("paid", "Current paid"),
        moneyCol("amount", "Current pending"),
        col("age", "Age in days", "number"),
        col("status", "Settlement"),
      ];
      sumKeys = ["net", "paid", "amount"];
    } else if (type === "projects") {
      demand(
        !f.beneficiary &&
          !f.category &&
          !f.status &&
          !f.reconciliation &&
          f.min == null &&
          f.max == null,
        "Project summaries support Society, department, project, bank, period and text filters.",
      );
      rows = s.masters.projects
        .map((p) => {
          const entries = cash.filter(
            (m) => m.projectId === p.id && (!f.bank || m.bankId === f.bank),
          );
          return {
            ...s.common({ ...p, projectId: p.id }),
            name: p.name,
            ...paymentCategories(entries, s.claimMap),
            contract: p.contractValue,
            receipts: total(
              entries.filter((m) => m.page === "receipts").map((m) => m.amount),
            ),
            payments: total(
              entries
                .filter((m) => m.page === "payments")
                .map((m) => -m.amount),
            ),
            available: total(
              s.receipts
                .filter(
                  (r) =>
                    r.projectId === p.id && (!f.bank || r.bankId === f.bank),
                )
                .map((r) => r.available),
            ),
            taxAvailable: total(
              s.taxes
                .filter(
                  (t) =>
                    t.projectId === p.id &&
                    (!f.bank ||
                      s.receiptMap.get(t.receiptId)?.bankId === f.bank),
                )
                .map((t) => t.available),
            ),
            _page: "projects",
            _id: p.id,
          };
        })
        .filter((r) => scoped(r, { ...f, bank: "" }));
      columns = [
        ...identity,
        col("department", "Department"),
        moneyCol("contract", "Contract value"),
        moneyCol("receipts", "Period net receipts"),
        moneyCol("payments", "Period net outward payments"),
        moneyCol("supplier", "Period net supplier payments"),
        moneyCol("subcontractor", "Period net sub-contractor payments"),
        moneyCol("labour", "Period net labour payments"),
        moneyCol("available", "Current receipt funds"),
        moneyCol("taxAvailable", "Current tax credit (not cash)"),
      ];
      sumKeys = [
        "contract",
        "receipts",
        "payments",
        "supplier",
        "subcontractor",
        "labour",
        "available",
        "taxAvailable",
      ];
    } else if (type === "tax") {
      rows = s.taxes
        .map((t) => ({
          ...s.common({ ...t, bankId: s.receiptMap.get(t.receiptId)?.bankId }),
          ref: t.ref,
          date: t.date,
          treatment: t.taxType,
          rate: t.rate / 100,
          base: t.base,
          expected: t.expected,
          deducted: t.deducted,
          credited: t.credited,
          used: t.used,
          available: t.available,
          pending: Math.max(0, t.expected - t.credited),
          reference: t.reference,
          status: t.status,
          amount: t.expected,
          _page: "tax",
          _id: t.id,
        }))
        .filter((r) => inPeriod(r.date, f) && scoped(r, f));
      columns = [
        ...identity,
        col("ref", "Tax ID"),
        col("date", "Tax record date", "date"),
        col("treatment", "Treatment"),
        col("rate", "Rate %", "number"),
        moneyCol("base", "Tax base"),
        moneyCol("expected", "Expected"),
        moneyCol("deducted", "Deducted"),
        moneyCol("credited", "Current credited"),
        moneyCol("used", "Current set off"),
        moneyCol("available", "Current available tax credit"),
        moneyCol("pending", "Current expected credit pending"),
        col("reference", "Evidence reference"),
        col("status", "Current status"),
      ];
      sumKeys = [
        "expected",
        "deducted",
        "credited",
        "used",
        "available",
        "pending",
      ];
    } else if (type === "reconciliation") {
      demand(
        !f.department && !f.project && !f.beneficiary && !f.category,
        "Reconciliation supports Society, bank, period, status, text and amount filters.",
      );
      rows = s.lines
        .map((l) => ({
          societyId: s.records.get(l.bankId)?.societyId,
          bankId: l.bankId,
          society: s.name(s.records.get(l.bankId)?.societyId),
          bank: s.name(l.bankId),
          date: l.date,
          reference: l.reference,
          narration: l.narration,
          amount: l.amount,
          matched: l.matched,
          difference: l.remaining,
          transactions: l.links
            .map(
              (link) =>
                s.movements.find((m) => m.movement_key === link.movement_key)
                  ?.payment_id || link.movement_key,
            )
            .join("; "),
          owner: l.exceptions
            .filter((e) => e.status === "Open")
            .map((e) => e.owner)
            .join("; "),
          reason: l.exceptions
            .filter((e) => e.status === "Open")
            .map((e) => e.reason)
            .join("; "),
          status: l.status,
          reconciliation: l.status,
          _page: "reconciliation",
          _line: l.id,
        }))
        .filter((r) => inPeriod(r.date, f) && scoped(r, f));
      columns = [
        col("society", "Society"),
        col("bank", "Bank"),
        col("date", "Statement date", "date"),
        col("reference", "Reference"),
        col("narration", "Narration"),
        moneyCol("amount", "Signed statement amount"),
        col("transactions", "Linked transactions"),
        moneyCol("matched", "Matched magnitude"),
        moneyCol("difference", "Unmatched magnitude"),
        col("owner", "Open exception owner"),
        col("reason", "Open exception reason"),
        col("status", "Status"),
      ];
      sumKeys = ["amount", "matched", "difference"];
    }
    rows.sort(
      (a, b) =>
        (a.date || a.society || "").localeCompare(b.date || b.society || "") ||
        String(a.paymentId || a.transaction || a.ref || "").localeCompare(
          String(b.paymentId || b.transaction || b.ref || ""),
        ),
    );
    const totals = Object.fromEntries(
      sumKeys.map((k) => [k, total(rows.map((r) => r[k] || 0))]),
    );
    const scope = ["society", "department", "project", "bank", "beneficiary"]
      .filter((k) => f[k])
      .map((k) => `${k}: ${s.name(f[k])}`);
    for (const k of ["q", "category", "status", "reconciliation"])
      if (f[k]) scope.push(`${k}: ${f[k]}`);
    if (f.min != null) scope.push(`minimum INR ${(f.min / 100).toFixed(2)}`);
    if (f.max != null) scope.push(`maximum INR ${(f.max / 100).toFixed(2)}`);
    return {
      type,
      title: reportCatalog[type],
      generatedAt: new Date().toISOString(),
      filters: f,
      scope: scope.join("; ") || "All Societies / records",
      dateBasis:
        "Bank credit/debit date for cash; source-record date for registers; current position where labelled.",
      notes,
      columns,
      rows,
      totals,
      metrics,
      pendingClaims,
      exceptions,
    };
  });
}

export function search(store, actor, raw = {}) {
  const f = filters(raw, "all");
  return snapshot(store, actor, (s) => {
    validateScope(s, f);
    const rows = [];
    for (const r of s.receipts) {
      const m = s.movements.find((m) => m.movement_key === `receipt:${r.id}`);
      rows.push({
        ...s.common(r),
        kind: "Receipt",
        ref: r.paymentId || "Draft receipt",
        reference: [r.billNumber, r.reference, r.chequeNumber]
          .filter(Boolean)
          .join(" / "),
        date: r.creditDate,
        amount: r.amount,
        status: r.status,
        reconciliation: m?.reconciliation || "Not posted",
        _page: r.paymentId ? "trace" : "receipts",
        _id: r.id,
      });
    }
    for (const p of s.payments)
      for (const d of p.distributions) {
        const c = s.claimMap.get(d.claimId),
          m = s.movements.find((m) => m.movement_key === `payment:${p.id}`);
        rows.push({
          ...s.common(p),
          kind: "Payment distribution",
          ref: p.ref || "Draft payment",
          reference: [p.reference, p.chequeNumber, c.reference]
            .filter(Boolean)
            .join(" / "),
          beneficiaryId: c.beneficiaryId,
          beneficiaryPublicId: s.records.get(c.beneficiaryId)?.ref || "",
          beneficiary: s.name(c.beneficiaryId),
          category: c.category,
          date: p.paymentDate,
          amount: d.amount,
          status: p.status,
          reconciliation: m?.reconciliation || "Not posted",
          _page: "payments",
          _id: p.id,
        });
      }
    for (const c of s.claims)
      rows.push({
        ...s.common(c),
        kind: "Claim",
        ref: c.ref,
        reference: c.reference,
        beneficiaryId: c.beneficiaryId,
        beneficiaryPublicId: s.records.get(c.beneficiaryId)?.ref || "",
        beneficiary: s.name(c.beneficiaryId),
        category: c.category,
        date: c.invoiceDate || c.periodEnd || c.createdAt.slice(0, 10),
        amount: c.net,
        status: c.status,
        _page: "claims",
        _id: c.id,
      });
    for (const t of s.taxes)
      rows.push({
        ...s.common({ ...t, bankId: s.receiptMap.get(t.receiptId)?.bankId }),
        kind: "Tax record",
        ref: t.ref,
        reference: t.reference,
        date: t.date,
        amount: t.expected,
        status: t.status,
        _page: "tax",
        _id: t.id,
      });
    const found = rows.filter((r) => inPeriod(r.date || "", f) && scoped(r, f));
    found.sort(
      (a, b) =>
        Number(b.ref.toLowerCase() === f.q.toLowerCase()) -
          Number(a.ref.toLowerCase() === f.q.toLowerCase()) ||
        (b.date || "").localeCompare(a.date || ""),
    );
    return {
      filters: f,
      rows: found,
      columns: [
        col("kind", "Record"),
        col("ref", "ID"),
        ...identity,
        col("department", "Department"),
        col("bank", "Bank"),
        col("beneficiary", "Beneficiary"),
        col("category", "Category"),
        col("reference", "Reference"),
        col("date", "Business date", "date"),
        moneyCol("amount", "Record amount (not additive)"),
        col("status", "Status"),
        col("reconciliation", "Reconciliation"),
      ],
    };
  });
}

export function trace(store, actor, id) {
  return snapshot(store, actor, (s) => {
    const item = s.receipts.find(
      (r) => r.id === id || r.paymentId?.toLowerCase() === id.toLowerCase(),
    );
    demand(item?.paymentId, "Posted Payment ID not found.", 404);
    const receipt = store.receipt(item.id),
      payments = s.payments.filter(
        (p) => p.allocations.some((a) => a.receiptId === item.id) && !!p.ref,
      ),
      taxes = s.taxes.filter((t) => t.receiptId === item.id);
    const ids = new Set([
      item.id,
      ...payments.map((p) => p.id),
      ...taxes.map((t) => t.id),
    ]);
    const movements = s.movements.filter((m) => ids.has(m.entity_id));
    const lines = s.lines.filter((l) =>
      l.links.some((link) =>
        movements.some((m) => m.movement_key === link.movement_key),
      ),
    );
    const timeline = [...ids]
      .flatMap((entity) => store.auditList(actor, entity))
      .sort((a, b) => a.id - b.id);
    return {
      receipt,
      context: s.common(item),
      payments: payments.map((p) => ({
        ...p,
        allocatedFromReceipt: p.allocations.find((a) => a.receiptId === item.id)
          .amount,
        beneficiaries: p.distributions.map((d) => ({
          name: s.name(s.claimMap.get(d.claimId).beneficiaryId),
          claim: s.claimMap.get(d.claimId).ref,
          amount: d.amount,
        })),
      })),
      taxes,
      lines,
      movements: movements.map(({ source, ...m }) => m),
      timeline,
    };
  });
}

export function dashboard(store, actor, raw = {}) {
  return report(store, actor, { ...raw, type: "summary" });
}
