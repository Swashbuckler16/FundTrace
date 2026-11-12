import { html, markup, t, msg } from "./i18n.js";
let excelLoading;
function loadExcel() {
  if (globalThis.XLSX) return Promise.resolve(globalThis.XLSX);
  if (!excelLoading)
    excelLoading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/vendor/xlsx.full.min.js";
      script.onload = () => resolve(globalThis.XLSX);
      script.onerror = () => {
        excelLoading = null;
        script.remove();
        reject(
          new Error(t("Could not load the local Excel exporter. Try again.")),
        );
      };
      document.head.append(script);
    });
  return excelLoading;
}
export async function renderReports(main, r, ui) {
  const {
    api,
    esc,
    head,
    href,
    rupees,
    when,
    records,
    navigate,
    errorBox,
    historyMarkup,
  } = ui;
  const { page: ignoredPage, ...query } = Object.fromEntries(
      new URL(location.href).searchParams,
    ),
    page = r.page;
  const link = (row) =>
    href(
      row._page,
      row._line ? { line: row._line } : row._id ? { id: row._id } : {},
    );
  const format = (value, type) =>
    value == null ? "" : type === "money" ? rupees(value) : String(value);
  const table = (columns, rows, print = false) =>
    rows.length
      ? html`<div class="table-wrap"><table class="report-data ${print && columns.length > 9 ? "print-wide" : ""}"><thead><tr>${columns.map((c) => html`<th scope="col">${esc(t(c.label))}</th>`).join("")}${print ? "" : markup('<th scope="col">Source</th>')}</tr></thead><tbody>${rows.map((row) => html`<tr>${columns.map((c) => html`<td data-label="${esc(t(c.label))}" class="${["money", "number"].includes(c.type) ? "numeric" : ""}">${esc(format(["status", "category", "reconciliation", "kind", "type", "mode", "event"].includes(c.key) ? t(row[c.key]) : row[c.key], c.type))}</td>`).join("")}${print ? "" : html`<td data-label="Source"><a href="${link(row)}">Open record</a></td>`}</tr>`).join("")}</tbody></table></div>`
      : markup('<section class="empty"><h2>No matching records</h2><p>Adjust the filters or record and post your actual transactions.</p></section>');
  const amounts = (items) =>
    html`<dl class="details report-totals">${Object.entries(items)
      .map(([k, v]) => html`<div><dt>${esc(t(k))}</dt><dd>${rupees(v)}</dd></div>`)
      .join("")}</dl>`;
  const totals = (result) =>
    amounts(
      Object.fromEntries(
        result.columns
          .filter((c) => Object.hasOwn(result.totals || {}, c.key))
          .map((c) => [c.label, result.totals[c.key]]),
      ),
    );
  const select = (key, label, options, value = "") =>
    html`<label>${esc(t(label))}<select name="${key}">${options.map(([v, caption]) => html`<option value="${esc(v)}" ${v === value ? "selected" : ""}>${esc(masterFilters[key] && v ? caption : t(caption))}</option>`).join("")}</select></label>`;
  const input = (key, label, value = "", type = "text") =>
    html`<label>${esc(t(label))}<input name="${key}" type="${type}" value="${esc(value)}"></label>`;
  const masterFilters = {
    society: "societies",
    department: "departments",
    project: "projects",
    bank: "banks",
    beneficiary: "beneficiaries",
  };
  const scopes = {
    summary: ["society", "bank"],
    receipts: [
      "society",
      "department",
      "project",
      "bank",
      "q",
      "status",
      "reconciliation",
      "min",
      "max",
    ],
    payments: [
      "society",
      "department",
      "project",
      "bank",
      "beneficiary",
      "category",
      "q",
      "status",
      "reconciliation",
      "min",
      "max",
    ],
    utilisation: [
      "society",
      "department",
      "project",
      "bank",
      "q",
      "status",
      "min",
      "max",
    ],
    pending: [
      "society",
      "department",
      "project",
      "beneficiary",
      "category",
      "q",
      "status",
      "min",
      "max",
    ],
    projects: ["society", "department", "project", "bank", "q"],
    tax: [
      "society",
      "department",
      "project",
      "bank",
      "q",
      "status",
      "min",
      "max",
    ],
    reconciliation: ["society", "bank", "q", "status", "min", "max"],
  };
  const filterForm = (f, type, catalog) => {
    const keys =
      page === "search" ? scopes.payments : scopes[type] || scopes.payments;
    const controls = keys
      .map((k) =>
        masterFilters[k]
          ? select(
              k,
              k[0].toUpperCase() + k.slice(1),
              [
                ["", `All ${masterFilters[k]}`],
                ...records[masterFilters[k]].map((x) => [
                  x.id,
                  `${x.name}${x.status === "Inactive" ? " (inactive)" : ""}`,
                ]),
              ],
              f[k],
            )
          : k === "category"
            ? select(
                k,
                "Beneficiary category",
                [
                  ["", "All categories"],
                  ...[
                    "Supplier",
                    "Sub-contractor",
                    "Labour contractor",
                    "Individual labourer",
                  ].map((x) => [x, x]),
                ],
                f[k],
              )
            : k === "reconciliation"
              ? select(
                  k,
                  "Reconciliation",
                  [
                    ["", "All reconciliation states"],
                    ...[
                      "Matched",
                      "Unmatched",
                      "Partially matched",
                      "Exception",
                      "Not posted",
                    ].map((x) => [x, x]),
                  ],
                  f[k],
                )
              : input(
                  k,
                  {
                    q: "Search IDs, names or references",
                    min: "Minimum amount (INR)",
                    max: "Maximum amount (INR)",
                    status: "Status (exact, optional)",
                  }[k],
                  ["min", "max"].includes(k)
                    ? f[k] == null
                      ? ""
                      : String(f[k] / 100)
                    : f[k],
                ),
      )
      .join("");
    return html`<form id="report-filter" class="form-panel" novalidate>${errorBox("")}<div class="form-grid">${catalog ? select("type", "Report", Object.entries(catalog), type) : ""}${select(
      "period",
      "Period",
      [
        ["fy", "Indian financial year"],
        ["month", "Calendar month"],
        ["custom", "Custom dates"],
        ["all", "All dates"],
      ],
      f.period,
    )}<span data-period="fy">${input("year", "Financial-year start (YYYY)", f.year)}</span><span data-period="month">${input("month", "Calendar month", f.month, "month")}</span><span data-period="custom">${input("from", "From", f.from, "date")}</span><span data-period="custom">${input("to", "To", f.to, "date")}</span>${controls}</div><div class="toolbar"><button type="submit" class="primary">Apply filters</button><a class="button quiet" href="${href(page, page === "reports" ? { type } : {})}">Reset filters</a></div></form>`;
  };
  const bindFilters = () => {
    const form = document.querySelector("#report-filter");
    const update = () =>
      form.querySelectorAll("[data-period]").forEach((el) => {
        el.hidden = el.dataset.period !== form.elements.period.value;
        el.querySelectorAll("input").forEach(
          (input) => (input.disabled = el.hidden),
        );
      });
    update();
    form.elements.period.onchange = update;
    if (form.elements.type)
      form.elements.type.onchange = () => {
        const data = Object.fromEntries(new FormData(form));
        const keep = {
          type: data.type,
          period: data.period,
          year: data.year || "",
          month: data.month || "",
          from: data.from || "",
          to: data.to || "",
          society: data.society || "",
          bank: (scopes[data.type] || scopes.payments).includes("bank")
            ? data.bank || ""
            : "",
        };
        navigate(href(page, keep));
      };
    form.onsubmit = (e) => {
      e.preventDefault();
      navigate(href(page, Object.fromEntries(new FormData(form))));
    };
  };
  const paginated = (result) => {
    let index = 0;
    const size = 25;
    const draw = () => {
      const start = index * size;
      document.querySelector("#report-rows").innerHTML = table(
        result.columns,
        result.rows.slice(start, start + size),
      );
      document.querySelector("#page-count").textContent = result.rows.length
        ? msg`${start + 1}–${Math.min(start + size, result.rows.length)} of ${result.rows.length} records`
        : t("0 records");
      document.querySelector("#previous-page").disabled = index === 0;
      document.querySelector("#next-page").disabled =
        start + size >= result.rows.length;
    };
    document.querySelector("#previous-page").onclick = () => {
      index--;
      draw();
    };
    document.querySelector("#next-page").onclick = () => {
      index++;
      draw();
    };
    draw();
  };
  const listShell =
    markup('<p id="page-count" role="status"></p><div id="report-rows"></div><div class="toolbar"><button id="previous-page" type="button">Previous page</button><button id="next-page" type="button">Next page</button></div>');
  const metadata = (result) =>
    html`<p>${esc(t(result.filters.label))}, ${esc(scopeText(result))}</p><p>Generated ${esc(when(result.generatedAt))}. ${esc(t(result.dateBasis))}</p><p class="notice">${esc(t(result.notes))}</p>`;
  function scopeText(result) {
    const f = result.filters;
    const parts = Object.entries(masterFilters).filter(([key]) => f[key]).map(([key, kind]) => `${t(key)}: ${records[kind].find(row => row.id === f[key])?.name || ""}`);
    for (const key of ["q", "category", "status", "reconciliation"]) if (f[key]) parts.push(`${t(key === "q" ? "Search" : key)}: ${key === "q" ? f[key] : t(f[key])}`);
    if (f.min != null) parts.push(`${t("Minimum amount (INR)")}: ${rupees(f.min)}`);
    if (f.max != null) parts.push(`${t("Maximum amount (INR)")}: ${rupees(f.max)}`);
    return parts.join("; ") || t("All Societies / records");
  }
  if (page === "trace") {
    const data = await api(
        `/trace?id=${encodeURIComponent(r.id || query.q || "")}`,
      ),
      receipt = data.receipt;
    main.innerHTML =
      head(
        t("Payment ID 360"),
        receipt.paymentId,
        html`<a class="button" href="${href("receipts", { id: receipt.id })}">Open receipt</a>`,
      ) +
      html`<p>${esc(data.context.society)}, ${esc(data.context.project)}, ${esc(data.context.workOrder)}. ${esc(t(receipt.status))}.</p>` +
      amounts({
        "Original bank credit": receipt.amount,
        "Current allocated":
          receipt.status === "Posted" ? receipt.amount - receipt.available : 0,
        "Current available": receipt.available,
      }) +
      html`<p>Credit date ${esc(receipt.creditDate)}. Bill ${esc(receipt.billNumber || t("not specified"))}. Bank ${esc(data.context.bank)}.</p><section class="finance-section"><h2>Receipt evidence</h2><ul>${receipt.evidence.map((e) => html`<li><a href="/api/receipts/${receipt.id}/evidence/${e.id}" download>${esc(e.name)}</a></li>`).join("")}</ul></section><section class="finance-section"><h2>Linked outward payments</h2>${table(
        [
          { key: "ref", label: "Transaction ID" },
          { key: "paymentDate", label: "Payment date" },
          { key: "beneficiaries", label: "Beneficiary / claim" },
          { key: "amount", label: "Whole payment", type: "money" },
          {
            key: "allocatedFromReceipt",
            label: "From this receipt",
            type: "money",
          },
          { key: "status", label: "Current status" },
        ],
        data.payments.map((p) => ({
          ...p,
          beneficiaries: p.beneficiaries
            .map((b) => `${b.name}, ${b.claim}, ${rupees(b.amount)}`)
            .join("; "),
          _page: "payments",
          _id: p.id,
        })),
      )}<p>Reversed payments remain visible; their allocations are excluded from current allocated funds. Whole-payment amounts are not additive across receipt views.</p>${data.payments.map((p) => html`<details><summary>${esc(p.ref)} evidence</summary><ul>${p.evidence.map((e) => html`<li><a href="/api/payments/${p.id}/evidence/${e.id}" download>${esc(e.name)}</a></li>`).join("")}</ul></details>`).join("")}</section><section class="finance-section"><h2>Related tax records</h2>${table(
        [
          { key: "ref", label: "Tax ID" },
          { key: "taxType", label: "Treatment" },
          { key: "expected", label: "Expected", type: "money" },
          { key: "credited", label: "Credited", type: "money" },
          { key: "used", label: "Set off", type: "money" },
          {
            key: "available",
            label: "Available tax (not cash)",
            type: "money",
          },
        ],
        data.taxes.map((t) => ({ ...t, _page: "tax", _id: t.id })),
      )}</section><section class="finance-section"><h2>Reconciliation</h2>${table(
        [
          { key: "payment_id", label: "Movement" },
          { key: "date", label: "Bank date" },
          { key: "amount", label: "Signed bank movement", type: "money" },
          { key: "reconciliation", label: "Match status" },
        ],
        data.movements.map((m) => ({ ...m, _page: m.page, _id: m.entity_id })),
      )}${data.lines.map((l) => html`<p><a href="${href("reconciliation", { line: l.id })}">${esc(l.reference || l.narration)}: ${esc(t(l.status))}</a></p>`).join("")}</section><section class="finance-section"><h2>Chronological activity</h2><p>Local workspace actions; up to 250 recent entries per linked record.</p>${historyMarkup(data.timeline)}</section>`;
    return;
  }
  if (page === "search") {
    const result = await api(`/search?${new URLSearchParams(query)}`);
    main.innerHTML =
      head(
        t("Search & Payment ID 360"),
        t("Find receipts, payments, claims and tax records. Exact Payment IDs appear first."),
      ) +
      filterForm(result.filters, "payments") +
      markup("<p>Search includes drafts and reversals. Amounts describe each record and must not be added across record types. Actions are attributed to the local workspace.</p>") +
      listShell;
    bindFilters();
    paginated(result);
    return;
  }
  if (page === "dashboard") {
    const result = await api(`/dashboard?${new URLSearchParams(query)}`),
      cashTotals = result.totals;
    const comparisons = [
      ["Net Government receipts", cashTotals.receiptNet || 0, "receipts"],
      ["Net supplier payments", cashTotals.supplier || 0, "supplier"],
      ["Net sub-contractor payments", cashTotals.subcontractor || 0, "subcontractor"],
      ["Net labour payments", cashTotals.labour || 0, "labour"],
      ["Net other bank movements", cashTotals.other || 0, "summary"],
    ];
    const max = Math.max(1, ...comparisons.map((x) => Math.abs(x[1])));
    main.innerHTML =
      head(
        t("Financial dashboard"),
        t("Posted bank movements, receipt funds and tax positions kept separate."),
        html`<a class="button" href="${href("reports", { ...query, type: "summary" })}">Open consolidated report</a>`,
      ) +
      html`<p>${esc(t(result.filters.label))}, ${esc(scopeText(result))}. Cash uses bank movement dates.</p>` +
      amounts({
        "Opening / initial bank balance": cashTotals.opening || 0,
        "Period bank credits": cashTotals.credits || 0,
        "Period bank debits": cashTotals.debits || 0,
        "Closing bank balance": cashTotals.closing || 0,
      }) +
      filterForm(result.filters, "summary") +
      html`<details><summary>Report definitions and generation time</summary>${metadata(result)}</details>` +
      html`<section class="finance-section"><h2>Period cash breakdown</h2><p>Net values include reversals. Bar lengths show magnitude; signed values show direction.</p><ul class="comparison-list">${comparisons.map(([label, value, type]) => html`<li><a href="${href("reports", { ...query, type })}">${esc(t(label))}</a><strong>${rupees(value)}</strong><svg viewBox="0 0 400 14" preserveAspectRatio="none" height="14" aria-hidden="true"><rect width="${(Math.abs(value) / max) * 400}" height="14"></rect></svg></li>`).join("")}</ul></section><section class="finance-section"><h2>Receipt funds and tax</h2>${amounts(result.metrics)}<p>Current pending approved claims across the selected Society: ${rupees(result.pendingClaims)}. This claim total is not bank-specific. Statement lines with open exceptions: ${result.exceptions}.</p><a href="${href("reports", { type: "pending", society: query.society || "", period: "all" })}">Review pending claims</a></section><section class="finance-section"><h2>Bank balances</h2>${table(
        result.columns.filter((c) =>
          [
            "society",
            "bank",
            "opening",
            "credits",
            "debits",
            "closing",
          ].includes(c.key),
        ),
        result.rows,
      )}</section>`;
    bindFilters();
    return;
  }
  const [result, catalog] = await Promise.all([
    api(`/reports?${new URLSearchParams(query)}`),
    api("/report-catalog"),
  ]);
  main.innerHTML =
    head(
      t("Reports & exports"),
      t("Review source-linked totals, then export the same report offline."),
    ) +
    filterForm(result.filters, result.type, catalog) +
    html`<section class="finance-section"><h2>${esc(t(result.title))}</h2>${metadata(result)}${totals(result)}${Object.keys(result.metrics).length ? html`<h3>Separate receipt / tax positions</h3>${amounts(result.metrics)}` : ""}<div class="toolbar"><button type="button" id="export-xlsx">Export Excel (.xlsx)</button><button type="button" id="export-print">Print / save PDF</button></div><p>Exports include all filtered rows, not just this page. PDF uses your browser’s offline Save as PDF destination.</p><p id="export-status" role="status"></p>${errorBox("")}${listShell}</section>`;
  bindFilters();
  paginated(result);
  const exportReport = async (formatName) => {
    const buttons = [
        document.querySelector("#export-xlsx"),
        document.querySelector("#export-print"),
      ],
      status = document.querySelector("#export-status"),
      error = status.nextElementSibling;
    buttons.forEach((b) => (b.disabled = true));
    error.textContent = "";
    status.textContent = t("Preparing local export…");
    try {
      const fresh = await api("/report-export", {
        method: "POST",
        body: { format: formatName, filters: { ...query, type: result.type } },
      });
      if (formatName === "xlsx") {
        const XLSX = await loadExcel(),
          book = XLSX.utils.book_new();
        const metadataRows = [
          ["FundTrace", fresh.title],
          ["Period", fresh.filters.label],
          ["Filters", fresh.scope],
          ["Generated", fresh.generatedAt],
          ["Date basis", fresh.dateBasis],
          ["Definitions", fresh.notes],
          [
            "Privacy",
            "Bank accounts masked; personal contact and identity fields omitted",
          ],
          [],
          ["Separate positions / totals", "INR"],
          ...Object.entries(fresh.metrics).map(([k, v]) => [k, v / 100]),
          ...fresh.columns
            .filter((c) => Object.hasOwn(fresh.totals, c.key))
            .map((c) => [c.label, fresh.totals[c.key] / 100]),
        ];
        const meta = XLSX.utils.aoa_to_sheet(metadataRows);
        meta["!cols"] = [{ wch: 42 }, { wch: 100 }];
        for (let i = 9; i < metadataRows.length; i++)
          if (meta[`B${i + 1}`]) meta[`B${i + 1}`].z = "#,##0.00";
        XLSX.utils.book_append_sheet(book, meta, "Report info");
        const values = fresh.rows.map((row) =>
          fresh.columns.map((c) =>
            c.type === "money"
              ? (row[c.key] || 0) / 100
              : c.type === "date" && row[c.key]
                ? (Date.parse(row[c.key]) - Date.UTC(1899, 11, 31)) / 86400000 +
                  (row[c.key] >= "1900-03-01" ? 1 : 0)
                : (row[c.key] ?? ""),
          ),
        );
        values.push(
          fresh.columns.map((c, i) =>
            Object.hasOwn(fresh.totals, c.key)
              ? fresh.totals[c.key] / 100
              : i === 0
                ? "Totals"
                : "",
          ),
        );
        const sheet = XLSX.utils.aoa_to_sheet(
          [fresh.columns.map((c) => c.label), ...values],
          { cellDates: false },
        );
        sheet["!cols"] = fresh.columns.map((c) => ({
          wch: c.type === "money" ? 20 : c.type === "date" ? 14 : 30,
        }));
        for (let i = 0; i < values.length; i++)
          fresh.columns.forEach((c, j) => {
            const cell = sheet[XLSX.utils.encode_cell({ r: i + 1, c: j })];
            if (cell?.t === "n" && c.type === "money") cell.z = "#,##0.00";
            if (cell?.t === "n" && c.type === "date") cell.z = "yyyy-mm-dd";
          });
        sheet["!autofilter"] = {
          ref: XLSX.utils.encode_range(
            { r: 0, c: 0 },
            { r: fresh.rows.length, c: fresh.columns.length - 1 },
          ),
        };
        XLSX.utils.book_append_sheet(book, sheet, "Records");
        XLSX.writeFile(
          book,
          `FundTrace-${fresh.type}-${new Date().toISOString().slice(0, 10)}.xlsx`,
        );
        status.textContent = t("Excel file prepared locally.");
      } else {
        document.querySelector("#print-report")?.remove();
        const print = document.createElement("article");
        print.id = "print-report";
        print.innerHTML = html`<h1>FundTrace — ${esc(t(fresh.title))}</h1>${metadata(fresh)}${totals(fresh)}${amounts(fresh.metrics)}${table(fresh.columns, fresh.rows, true)}<p>Reviewed by: ____________________ &nbsp; Date: ____________________</p><p>Bank accounts are masked. Personal contact and identity fields are omitted.</p>`;
        document.body.append(print);
        window.print();
        status.textContent =
          t("Print view prepared. Choose Save as PDF for a local PDF file.");
      }
    } catch (e) {
      error.textContent = e.message;
      error.focus();
      status.textContent = t("Export failed. Your records are unchanged.");
    } finally {
      buttons.forEach((b) => (b.disabled = false));
    }
  };
  document.querySelector("#export-xlsx").onclick = () => exportReport("xlsx");
  document.querySelector("#export-print").onclick = () => exportReport("print");
}
