import { html, markup, t, msg } from "./i18n.js";
export async function renderFinance(main, r, ui) {
  const {
    api,
    esc,
    field,
    F,
    head,
    href,
    rupees,
    when,
    nameOf,
    records,
    bindForm,
    errorBox,
    historyMarkup,
    navigate,
  } = ui;
  const kind = r.page,
    isClaim = kind === "claims";
  const claimFields = [
    F("societyId", "Society", "societies", true),
    F("projectId", "Project", "projects", true),
    F("beneficiaryId", "Beneficiary", "beneficiaries", true),
    F("reference", "Invoice / claim reference", "text", true),
    F("invoiceDate", "Invoice date", "date"),
    F("description", "Material / certified work description", "textarea"),
    F("certification", "Attendance / certification reference"),
    F("stage", "RA bill / work stage"),
    F("periodStart", "Work period start", "date"),
    F("periodEnd", "Work period end", "date"),
    F("quantity", "Days / quantity"),
    F("rate", "Rate (INR)"),
    F("gstInvoice", "GST invoice details"),
    F("gross", "Gross claim including GST (INR)", "decimal", true),
    F("gst", "GST included in gross (INR)", "decimal"),
    F("tds", "TDS deduction (INR)", "decimal"),
    F("retention", "Retention (INR)", "decimal"),
    F("otherDeduction", "Other deduction (INR)", "decimal"),
  ];
  const paymentFields = [
    F("societyId", "Society", "societies", true),
    F("projectId", "Project", "projects", true),
    F("bankId", "Paying bank account", "banks", true),
    F("paymentDate", "Bank debit date", "date", true),
    F("valueDate", "Value date", "date", true),
    F("mode", "Payment mode", "select", true, [
      "NEFT",
      "RTGS",
      "IMPS",
      "UPI",
      "Cheque",
      "Cash",
      "Other",
    ]),
    F("reference", "UTR / bank reference"),
    F("chequeNumber", "Cheque number"),
    F("remarks", "Payment remarks", "textarea"),
  ];
  const formFields = isClaim ? claimFields : paymentFields;
  const record = r.id ? await api(`/${kind}/${r.id}`) : null;
  const labels = { claims: "claim", payments: "payment" };
  function infoGrid(data) {
    return html`<dl class="details">${formFields.map((f) => html`<div><dt>${esc(t(f.label))}</dt><dd>${esc(f.type === "decimal" ? rupees(data[f.key]) : records[f.type] ? nameOf(f.type, data[f.key]) : (f.type === "select" ? t(data[f.key]) : data[f.key]) || t("Not provided"))}</dd></div>`).join("")}</dl>`;
  }
  function confirmationForm(actions) {
    return html`<section class="finance-section"><h2>Review and confirm</h2><form id="finance-action" class="form-panel" novalidate>${errorBox("")}<div class="form-grid">${field(
      F(
        "action",
        "Action",
        "select",
        true,
        actions.map((a) => a[1]),
      ),
    )}${field(F("reason", "Reason for return, cancellation, failure or duplicate override", "textarea"))}</div><label class="check-label"><input id="action-confirm" type="checkbox" name="confirm" required>I reviewed this record and confirm the selected action (required)</label>${!isClaim ? markup('<label class="check-label"><input id="action-override" type="checkbox" name="override">This is a separate debit if the amount and date match another payment</label>') : ""}<p>Local confirmation records your decision. Only posting affects cash and allocations. Posting records a payment already made; it does not send money.</p><button type="submit" class="primary">Confirm action</button></form></section>`;
  }
  function bindActions(actions) {
    bindForm("finance-action", async (data) => {
      await api(
        `/${kind}/${record.id}/${actions.find((a) => a[1] === data.action)[0]}`,
        {
          method: "POST",
          body: {
            revision: record.revision,
            confirm: data.confirm === "on",
            override: data.override === "on",
            reason: data.reason,
          },
        },
      );
      navigate(href(kind, { id: record.id }));
    });
  }
  if (r.create || r.edit) {
    if (record && record.status !== "Draft")
      throw new Error(t("Only draft records can be edited."));
    const correctionId = !isClaim
      ? new URL(location.href).searchParams.get("correction")
      : null;
    const correction = correctionId
      ? await api(`/payments/${correctionId}`)
      : null;
    const data = record || correction || {};
    main.innerHTML =
      head(
        t(`${record ? "Edit" : "New"} ${labels[kind]}`),
        isClaim
          ? t("Create a reusable claim for one or more instalments. Approval locks its financial terms.")
          : t("Record one bank debit and distribute it across claims. Allocate the full debit to receipts."),
      ) +
      html`<form id="finance-form" class="form-panel" novalidate>${errorBox("")}<div class="form-grid">${formFields.map((f) => field(f, data[f.key] ?? (f.type === "decimal" ? "0" : ""), !!record)).join("")}</div>
      ${isClaim ? markup('<p class="notice">Net payable = gross − TDS − retention − other deductions. GST is already included in gross; it is not added again. Supplier claims need an invoice date; work and labour claims need certification. Individual labour claims also need days and rate.</p>') : html`<label class="check-label"><input id="batch" type="checkbox" name="batch" ${data.batch ? "checked" : ""}>Labour batch: one bank debit with a beneficiary distribution schedule</label><h2>Claim distributions</h2><div id="distribution-rows"></div><button type="button" id="add-distribution">Add claim row</button><h2 class="finance-section">Receipt funding</h2><div id="allocation-rows"></div><button type="button" id="add-allocation">Add receipt row</button><p class="notice">Only approved claims and posted receipts in this project are eligible. Funding must use the paying bank account. Drafts do not reserve funds; posting rechecks every balance.</p>${correction || data.correctionOf ? html`<p>Correction of <a href="${href("payments", { id: correction?.id || data.correctionOf })}">${esc(correction?.ref || data.correctionOf)}</a>. The original remains in history.</p>` : ""}`}
      <div class="form-actions"><button type="submit" class="primary">Save ${t(labels[kind])} draft</button><a class="button quiet" href="${href(kind, record ? { id: record.id } : {})}">Cancel</a></div></form>`;
    const claims = !isClaim ? await api("/claims") : [],
      receipts = !isClaim ? await api("/receipts") : [];
    let serial = 0;
    function addRow(type, value = {}) {
      const id = ++serial,
        row = document.createElement("div");
      row.className = "funding-row";
      row.dataset.type = type;
      row.innerHTML = html`<label>${type === "distribution" ? t("Claim") : t("Receipt")}<select id="${type}-${id}" class="source" aria-describedby="source-summary-${id}" required></select><small id="source-summary-${id}" class="funding-summary" aria-live="polite"></small></label><label>Amount (INR)<input id="amount-${id}" class="row-amount" type="text" inputmode="decimal" pattern="[0-9]+(\\.[0-9]{1,2})?" required value="${value.amount == null ? "" : esc((value.amount / 100).toFixed(2))}"></label><button type="button" class="quiet" aria-label="Remove ${t(type)} row ${id}">Remove</button>`;
      row.querySelector("button").onclick = () => row.remove();
      document
        .querySelector(
          `#${type === "distribution" ? "distribution" : "allocation"}-rows`,
        )
        .append(row);
      row.dataset.initial = value.claimId || value.receiptId || "";
      refreshRows();
    }
    function refreshRows() {
      if (isClaim) return;
      const society = document.querySelector("#f-societyId").value,
        project = document.querySelector("#f-projectId").value,
        bank = document.querySelector("#f-bankId").value;
      document.querySelectorAll(".funding-row").forEach((row) => {
        const select = row.querySelector("select"),
          selected = select.value || row.dataset.initial;
        const distribution = row.dataset.type === "distribution";
        const list = (distribution ? claims : receipts).filter(
          (x) =>
            x.societyId === society &&
            x.projectId === project &&
            x.status === (distribution ? "Approved" : "Posted") &&
            (distribution || x.bankId === bank),
        );
        select.innerHTML =
          markup('<option value="">Select a source</option>') +
          list
            .map(
              (x) =>
                html`<option value="${x.id}" ${x.id === selected ? "selected" : ""}>${esc(distribution ? msg`${x.ref}, ${nameOf("beneficiaries", x.beneficiaryId)}, pending ${rupees(x.pending)}` : msg`${x.paymentId}, available ${rupees(x.available)}`)}</option>`,
            )
            .join("");
        const describe = () => {
          row.querySelector(".funding-summary").textContent = select.value
            ? select.selectedOptions[0].textContent
            : t("Choose a record to see its balance.");
        };
        select.onchange = describe;
        describe();
        row.dataset.initial = "";
      });
    }
    function scope() {
      const society = document.querySelector("#f-societyId").value;
      for (const [key, type] of [
        ["projectId", "projects"],
        [
          isClaim ? "beneficiaryId" : "bankId",
          isClaim ? "beneficiaries" : "banks",
        ],
      ]) {
        const select = document.querySelector(`#f-${key}`),
          value = select.value;
        select.innerHTML =
          markup('<option value="">Select a record</option>') +
          records[type]
            .filter((x) => x.societyId === society && x.status === "Active")
            .map(
              (x) =>
                html`<option value="${x.id}" ${value === x.id ? "selected" : ""}>${esc(x.name)}</option>`,
            )
            .join("");
      }
      refreshRows();
    }
    document.querySelector("#f-societyId").onchange = scope;
    scope();
    if (!isClaim) {
      document.querySelector("#f-projectId").onchange = refreshRows;
      document.querySelector("#f-bankId").onchange = refreshRows;
      document.querySelector("#add-distribution").onclick = () =>
        addRow("distribution");
      document.querySelector("#add-allocation").onclick = () =>
        addRow("allocation");
      for (const value of data.distributions || [{}])
        addRow("distribution", value);
      for (const value of data.allocations || [{}]) addRow("allocation", value);
    }
    bindForm("finance-form", async (raw) => {
      if (record) {
        raw.revision = record.revision;
        raw.societyId = record.societyId;
      }
      if (!isClaim) {
        raw.batch = raw.batch === "on";
        raw.correctionOf = correction?.id || data.correctionOf || "";
        const rows = (type) =>
          [
            ...document.querySelectorAll(`.funding-row[data-type="${type}"]`),
          ].map((row) => ({
            [type === "distribution" ? "claimId" : "receiptId"]:
              row.querySelector("select").value,
            amount: row.querySelector("input").value,
          }));
        raw.distributions = rows("distribution");
        raw.allocations = rows("allocation");
      }
      const saved = await api(`/${kind}${record ? "/" + record.id : ""}`, {
        method: record ? "PUT" : "POST",
        body: raw,
      });
      navigate(href(kind, { id: saved.id }));
    });
    return;
  }
  if (record) {
    const history = await api(`/audit?entity=${record.id}`);
    const actions = isClaim
      ? record.status === "Draft"
        ? [
            ["approve", "Approve claim"],
            ["cancel", "Cancel claim"],
          ]
        : record.status === "Approved" && record.paid === 0
          ? [["cancel", "Cancel claim"]]
          : []
      : {
          Draft: [
            ["submit", "Submit for review"],
            ["cancel", "Cancel payment"],
            ["fail", "Mark failed (no bank debit)"],
          ],
          Submitted: [
            ["approve", "Approve payment"],
            ["return", "Return to draft"],
            ["cancel", "Cancel payment"],
            ["fail", "Mark failed (no bank debit)"],
          ],
          Approved: [
            ["post", "Post confirmed bank debit"],
            ["return", "Return to draft"],
            ["cancel", "Cancel payment"],
            ["fail", "Mark failed (no bank debit)"],
          ],
        }[record.status] || [];
    main.innerHTML =
      html`<a class="button quiet back" href="${href(kind)}">Back to ${isClaim ? t("claims") : t("payments")}</a>` +
      head(
        record.ref || t("Payment draft"),
        msg`${t(record.status)}, entered ${when(record.createdAt)}`,
        record.status === "Draft"
          ? html`<a class="button" href="${href(kind, { id: record.id, edit: "1" })}">Edit draft</a>`
          : !isClaim &&
              ["Failed", "Reversed", "Cancelled"].includes(record.status)
            ? html`<a class="button" href="${href(kind, { new: "1", correction: record.id })}">Create corrected payment</a>`
            : "",
      ) +
      html`<div class="summary">${(isClaim
        ? [
            ["Net payable", record.net],
            ["Posted payments", record.paid],
            ["Pending", record.pending],
          ]
        : [["Bank debit", record.amount]]
      )
        .map(
          ([label, value]) =>
            html`<div><strong>${rupees(value)}</strong><span>${t(label)}</span></div>`,
        )
        .join(
          "",
        )}</div>${isClaim ? html`<p>${esc(t(record.category))}, ${esc(t(record.settlement))}</p>` : html`<p>${record.batch ? t("Labour batch: one bank debit, linked distribution schedule.") : t("Single claim payment.")}</p>`}${infoGrid(record)}`;
    if (isClaim) {
      main.insertAdjacentHTML(
        "beforeend",
        html`<section class="finance-section"><h2>Instalment history</h2><p>Only active posted instalments reduce the pending amount.</p>${record.paymentHistory.length ? html`<ul>${record.paymentHistory.map((p) => html`<li><a href="${href("payments", { id: p.payment_id })}">${esc(p.ref)}</a> ${rupees(p.amount)} — ${esc(t(p.status))}${p.status !== "Posted" ? t(" (excluded from balances)") : ""}</li>`).join("")}</ul>` : markup("<p>No posted instalments yet.</p>")}</section>`,
      );
    } else {
      const claims = await api("/claims"),
        receipts = await api("/receipts");
      main.insertAdjacentHTML(
        "beforeend",
        html`<section class="finance-section"><h2>Beneficiary distribution</h2><div class="table-wrap"><table><thead><tr><th>Claim / beneficiary</th><th>Amount</th></tr></thead><tbody>${record.distributions
          .map((row) => {
            const claim = claims.find((c) => c.id === row.claimId);
            return html`<tr><td><a href="${href("claims", { id: row.claimId })}">${esc(claim?.ref)}</a><small>${esc(nameOf("beneficiaries", claim?.beneficiaryId))}</small></td><td data-label="Amount">${rupees(row.amount)}</td></tr>`;
          })
          .join(
            "",
          )}</tbody></table></div><h2>Receipt allocations</h2><ul>${record.allocations.map((row) => html`<li><a href="${href("receipts", { id: row.receiptId })}">${esc(receipts.find((x) => x.id === row.receiptId)?.paymentId)}</a> ${rupees(row.amount)}</li>`).join("")}</ul><p>${record.status === "Posted" ? t("These allocations reduce receipt availability.") : t("Only active posted payments consume funding. This schedule remains in history.")}</p></section><section class="finance-section"><h2>Payment evidence</h2>${record.evidence.length ? html`<ul>${record.evidence.map((f) => html`<li><a href="/api/payments/${record.id}/evidence/${f.id}" download>${esc(f.name)}</a></li>`).join("")}</ul>` : markup("<p>No evidence attached.</p>")}${record.status === "Draft" ? html`<form id="payment-evidence" class="form-panel" novalidate>${errorBox("")}<label>Payment evidence file (required)<input id="payment-file" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg" required></label><p>Attach invoice, wage sheet or bank proof. PDF, PNG or JPEG; maximum 2 MB each and five files.</p><button type="submit">Attach payment evidence</button></form>` : ""}</section>`,
      );
      if (record.status === "Draft")
        bindForm("payment-evidence", async (_, form) => {
          const file = form.elements.file.files[0];
          if (!file || file.size > 2 * 1024 * 1024)
            throw new Error(t("Select evidence no larger than 2 MB."));
          const data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = () => reject(new Error(t("Could not read file.")));
            reader.readAsDataURL(file);
          });
          await api(`/payments/${record.id}/evidence`, {
            method: "POST",
            body: { revision: record.revision, name: file.name, data },
          });
          navigate(href(kind, { id: record.id }));
        });
      if (record.correctionOf)
        main.insertAdjacentHTML(
          "beforeend",
          html`<p>Correction of <a href="${href("payments", { id: record.correctionOf })}">original payment</a>.</p>`,
        );
      if (record.status === "Posted") {
        main.insertAdjacentHTML(
          "beforeend",
          financialReversalForm(ui, "payments"),
        );
        bindFinancialReversal(ui, "payments", record);
      }
      if (record.reversal)
        main.insertAdjacentHTML(
          "beforeend",
          html`<p class="notice">${esc(t(record.status))} on ${esc(record.reversal.date)}. Bank reference: ${esc(record.reversal.reference)}. ${esc(record.reversal.reason)}</p>`,
        );
    }
    if (actions.length) {
      main.insertAdjacentHTML("beforeend", confirmationForm(actions));
      bindActions(actions);
    }
    main.insertAdjacentHTML(
      "beforeend",
      html`<section class="finance-section"><h2>Activity</h2>${historyMarkup(history)}</section>`,
    );
    return;
  }
  const list = (await api(`/${kind}`)).filter(
    (x) =>
      (!r.status || x.status === r.status) &&
      `${x.ref || ""} ${x.reference} ${nameOf("societies", x.societyId)}`
        .toLowerCase()
        .includes(r.q.toLowerCase()),
  );
  main.innerHTML =
    head(
      isClaim ? t("Claims & instalments") : t("Outward payments"),
      isClaim
        ? t("Track approved claims, part payments and the remaining payable amount.")
        : t("Record supplier payments and labour batches with traceable receipt funding."),
      html`<a class="button primary" href="${href(kind, { new: "1" })}">${t(isClaim ? "New claim" : "New payment")}</a>`,
    ) +
    html`<form id="finance-filter" class="toolbar"><label>Search ${t(kind)}<input name="q" value="${esc(r.q)}" placeholder="Reference or Society"></label><label>Status<select name="status"><option value="">All statuses</option>${(isClaim ? ["Draft", "Approved", "Cancelled"] : ["Draft", "Submitted", "Approved", "Posted", "Failed", "Cancelled", "Reversed"]).map((s) => html`<option value="${esc(s)}" ${r.status === s ? "selected" : ""}>${esc(t(s))}</option>`).join("")}</select></label><button type="submit">Apply filters</button><a href="${href(kind)}">Clear filters</a></form>` +
    (list.length
      ? html`<div class="table-wrap"><table><thead><tr><th>Reference / Society</th><th>${isClaim ? t("Net payable") : t("Bank debit")}</th><th>${isClaim ? t("Pending") : t("Payment date")}</th><th>Status</th><th>Record</th></tr></thead><tbody>${list.map((x) => html`<tr><td><strong>${esc(x.ref || t("Unposted payment"))}</strong><small>${esc(nameOf("societies", x.societyId))}</small></td><td data-label="Amount">${rupees(isClaim ? x.net : x.amount)}</td><td data-label="${t(isClaim ? "Pending" : "Payment date")}">${isClaim ? rupees(x.pending) : esc(x.paymentDate)}</td><td><span class="status">${esc(t(x.status))}</span></td><td><a class="button quiet" href="${href(kind, { id: x.id })}" aria-label="Open ${esc(x.ref || x.id)}">Open</a></td></tr>`).join("")}</tbody></table></div>`
      : html`<section class="empty"><h2>No matching ${t(kind)}</h2><p>${isClaim ? t("Create a claim before recording an instalment.") : t("Approve a claim and post a receipt before recording a funded payment.")}</p></section>`);
  document.querySelector("#finance-filter").onsubmit = (e) => {
    e.preventDefault();
    navigate(href(kind, Object.fromEntries(new FormData(e.target))));
  };
}

export function financialReversalForm(ui, kind) {
  const { field, F, errorBox } = ui;
  return html`<section class="finance-section"><h2>Reverse posted ${kind === "receipts" ? t("receipt") : t("payment")}</h2><form id="financial-reversal" class="form-panel" novalidate>${errorBox("")}<div class="form-grid">${field(F("date", "Reversal date", "date", true))}${field(F("reference", "Bank reversal evidence reference", "text", true))}${field(F("reason", "Reversal reason", "textarea", true))}${kind === "payments" ? field(F("outcome", "Outcome", "select", true, ["Reversed", "Failed"])) : ""}</div><label class="check-label"><input id="reverse-confirm" name="confirm" type="checkbox" required>I confirm the ${kind === "payments" ? t("bank debit has been returned or did not settle") : t("bank credit has been reversed")} and checked its evidence (required)</label><p>The original is retained. ${kind === "payments" ? t("This restores cash, claim pending and receipt availability once.") : t("All linked payments must first be reversed.")}</p><button type="submit">Confirm reversal</button></form></section>`;
}
export function bindFinancialReversal(ui, kind, record) {
  ui.bindForm("financial-reversal", async (data) => {
    await ui.api(`/${kind}/${record.id}/reverse`, {
      method: "POST",
      body: {
        ...data,
        revision: record.revision,
        confirm: data.confirm === "on",
      },
    });
    ui.navigate(ui.href(kind, { id: record.id }));
  });
}
