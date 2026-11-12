import { html, markup, t, msg } from "./i18n.js";
export async function renderReconciliation(main, r, ui) {
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
  const page = r.page,
    params = new URL(location.href).searchParams;
  const confirmBox = (
    label = "I checked the evidence and confirm this local action",
  ) =>
    html`<label class="check-label"><input name="confirm" type="checkbox" required>${esc(t(label))} (required)</label>`;
  const reasonField = () => field(F("reason", "Reason", "textarea", true));
  const panel = (id, body, button) =>
    html`<form id="${id}" class="form-panel" novalidate>${errorBox("")}${body.replace(/(id|for)="f-/g, `$1="${id}-f-`)}${confirmBox().replace('name="confirm"', `id="${id}-confirm" name="confirm"`)}<button type="submit" class="primary">${esc(t(button))}</button></form>`;
  const send = async (path, data) =>
    api(path, {
      method: "POST",
      body: { ...data, confirm: data.confirm === "on" },
    });
  const proof = async (file) => {
    if (!file || file.size === 0 || file.size > 2 * 1024 * 1024)
      throw new Error(t("Select a non-empty file no larger than 2 MB."));
    return {
      name: file.name,
      data: await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = () => reject(new Error(t("Could not read the file.")));
        reader.readAsDataURL(file);
      }),
    };
  };
  const fileField = () =>
    markup('<label>Supporting document (required)<input id="support-file" type="file" name="evidence" accept=".pdf,.png,.jpg,.jpeg" required></label><p>PDF, PNG or JPEG, up to 2 MB. Stored locally.</p>');
  const history = async (id) => historyMarkup(await api(`/audit?entity=${id}`));
  const table = (headers, rows) =>
    rows.length
      ? html`<div class="table-wrap"><table><thead><tr>${headers.map((h) => html`<th>${esc(t(h))}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => html`<tr>${row.map((cell, i) => html`<td data-label="${esc(t(headers[i]))}">${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
      : markup('<section class="empty"><h2>No records yet</h2><p>Use the action above to start with your actual records.</p></section>');
  if (page === "reconciliation") {
    const lineId = params.get("line");
    if (lineId) {
      const line = await api(`/statement-lines/${lineId}`),
        movements = await api(`/reconciliation-movements?bank=${line.bankId}`);
      const candidates = movements
        .filter(
          (m) =>
            m.remaining > 0 && Math.sign(m.amount) === Math.sign(line.amount),
        )
        .sort(
          (a, b) =>
            Number(
              b.reference?.toUpperCase() === line.reference.toUpperCase(),
            ) -
              Number(
                a.reference?.toUpperCase() === line.reference.toUpperCase(),
              ) ||
            Math.abs(Math.abs(a.amount) - Math.abs(line.amount)) -
              Math.abs(Math.abs(b.amount) - Math.abs(line.amount)),
        );
      main.innerHTML =
        html`<a class="button quiet" href="${href(page, { id: line.importId })}">Back to statement</a>` +
        head(
          t("Match statement line"),
          msg`${line.date}, ${line.reference || line.narration}, ${t(line.status)}`,
        ) +
        html`<dl class="details"><div><dt>Bank movement</dt><dd>${rupees(line.amount)}</dd></div><div><dt>Remaining to match</dt><dd>${rupees(line.remaining)}</dd></div><div><dt>Value date</dt><dd>${esc(line.valueDate)}</dd></div><div><dt>Narration</dt><dd>${esc(line.narration)}</dd></div></dl>` +
        html`<section class="finance-section"><h2>Linked bank movements</h2>${table(
          ["Movement", "Amount", "Action"],
          line.links.map((l) => {
            const m = movements.find((m) => m.movement_key === l.movement_key);
            return [
              esc(m?.payment_id || l.movement_key),
              rupees(l.amount),
              html`<button type="button" data-unmatch="${l.id}">Remove match</button>`,
            ];
          }),
        )}<div id="unmatch-panel"></div></section>` +
        panel(
          "match-form",
          html`<h2>Match remaining amount</h2><p>Candidates are ordered by reference and amount. Review the actual dates and evidence before confirming. Different dates or references require a reason.</p><div id="match-rows"></div><button type="button" id="add-match">Add movement</button>${field(F("reason", "Reason for date/reference difference", "textarea"))}`,
          "Confirm matches",
        ) +
        html`<section class="finance-section"><h2>Exceptions</h2>${table(
          ["Owner annotation", "Reason", "Opened", "Age", "Status"],
          line.exceptions.map((e) => [
            esc(e.owner),
            esc(e.reason),
            esc(when(e.openedAt)),
            `${Math.max(0, Math.floor((Date.parse(e.status === "Resolved" ? e.updatedAt : new Date().toISOString()) - Date.parse(e.openedAt)) / 86400000))} days`,
            esc(e.status),
          ]),
        )}</section>` +
        panel(
          "exception-form",
          html`<div class="form-grid">${field(F("id", "Exception", "select", false, ["New exception", ...line.exceptions.map((e) => e.id)]))}${field(F("owner", "Follow-up owner annotation", "text", true))}${field(F("status", "Status", "select", true, ["Open", "Resolved"]))}${reasonField()}</div><p>Owner names are annotations, not authenticated accounts. Resolving an exception does not match its remaining amount.</p>`,
          "Save exception",
        );
      let serial = 0;
      const add = () => {
        const id = ++serial,
          row = document.createElement("div");
        row.className = "funding-row";
        row.innerHTML = html`<label>Bank movement<select id="movement-${id}" required><option value="">Select movement</option>${candidates.map((m) => html`<option value="${m.movement_key}">${esc(m.payment_id)}, ${m.credit_date}, ${esc(m.reference)}, remaining ${rupees(m.remaining)}</option>`).join("")}</select><small class="funding-summary" aria-live="polite"></small></label><label>Match amount (INR)<input id="match-amount-${id}" inputmode="decimal" required></label><button type="button" class="quiet">Remove row</button>`;
        row.querySelector("button").onclick = () => row.remove();
        row.querySelector("select").onchange = (e) => {
          row.querySelector("small").textContent =
            e.target.selectedOptions[0].textContent;
        };
        document.querySelector("#match-rows").append(row);
      };
      document.querySelector("#add-match").onclick = add;
      add();
      bindForm("match-form", async (data) => {
        data.matches = [
          ...document.querySelectorAll("#match-rows .funding-row"),
        ].map((row) => ({
          movementKey: row.querySelector("select").value,
          amount: row.querySelector("input").value,
        }));
        await send(`/statement-lines/${line.id}/match`, data);
        navigate(location.href);
      });
      document.querySelectorAll("[data-unmatch]").forEach(
        (button) =>
          (button.onclick = () => {
            document.querySelector("#unmatch-panel").innerHTML = panel(
              "unmatch-form",
              reasonField(),
              "Confirm removal",
            );
            bindForm("unmatch-form", async (data) => {
              await send(
                `/statement-links/${button.dataset.unmatch}/unmatch`,
                data,
              );
              navigate(location.href);
            });
          }),
      );
      bindForm("exception-form", async (data) => {
        if (data.id === "New exception") delete data.id;
        else
          data.revision = line.exceptions.find(
            (e) => e.id === data.id,
          ).revision;
        await send(`/statement-lines/${line.id}/exception`, data);
        navigate(location.href);
      });
      return;
    }
    if (r.create) {
      main.innerHTML =
        head(
          t("Import bank statement"),
          t("Read a local CSV or Excel file, map its columns, preview and confirm. Imports do not create bank cash."),
        ) +
        html`<form id="statement-form" class="form-panel" novalidate>${errorBox("")}<div class="form-grid">${field(F("bankId", "Bank account", "banks", true))}${field(F("start", "Statement start", "date", true))}${field(F("end", "Statement end", "date", true))}${field(F("opening", "Statement opening balance (INR)", "text", true))}${field(F("closing", "Statement closing balance (INR)", "text", true))}${field(F("dateFormat", "Text date format", "select", true, ["YYYY-MM-DD", "DD/MM/YYYY"]))}</div><label>Statement file<input id="statement-file" type="file" accept=".csv,.xlsx,.xls"></label><p>Maximum 2 MB and 2,000 rows. Files stay on this computer. Use a header row; sort rows from oldest to newest.</p><label>Or enter statement rows as CSV<textarea id="manual-statement" placeholder="Date,Reference,Narration,Debit,Credit,Balance"></textarea></label><button type="button" id="read-statement">Read statement</button><div id="column-mapping"></div><button type="submit" class="primary">Preview import</button></form><section id="statement-preview" class="finance-section" aria-live="polite"></section>`;
      let parsed = null,
        source = null,
        buffer = null;
      const parse = async (sheet) =>
        new Promise((resolve, reject) => {
          const worker = new Worker("/statement-worker.js"),
            timer = setTimeout(() => {
              worker.terminate();
              reject(
                new Error(t("File parsing timed out. Use a smaller statement.")),
              );
            }, 15000);
          worker.onmessage = ({ data }) => {
            clearTimeout(timer);
            worker.terminate();
            data.error ? reject(new Error(data.error.startsWith("Could not read this statement: ")
              ? msg`Could not read this statement: ${t(data.error.slice("Could not read this statement: ".length))}`
              : t(data.error))) : resolve(data);
          };
          worker.onerror = () => {
            clearTimeout(timer);
            worker.terminate();
            reject(new Error(t("Could not parse the statement.")));
          };
          worker.postMessage({ buffer: buffer.slice(0), sheet });
        });
      const mapping = () => {
        const names = [
            "date",
            "valueDate",
            "reference",
            "narration",
            "debit",
            "credit",
            "balance",
          ],
          labels = [
            "Date",
            "Value date",
            "Reference",
            "Narration",
            "Debit",
            "Credit",
            "Balance",
          ];
        document.querySelector("#column-mapping").innerHTML =
          html`<h2>Column mapping</h2><label>Worksheet<select id="statement-sheet">${parsed.sheets.map((s) => html`<option ${s === parsed.sheet ? "selected" : ""}>${esc(s)}</option>`).join("")}</select></label><div class="form-grid">${names
            .map(
              (name, j) =>
                html`<label>${t(labels[j])}${name === "date" ? t(" (required)") : ""}<select id="map-${name}" ${name === "date" ? "required" : ""}><option value="">Not present</option>${parsed.rows[0]
                  .map(
                    (h, i) =>
                      html`<option value="${i}" ${
                        String(h)
                          .replace(/[^a-z]/gi, "")
                          .toLowerCase() === name.toLowerCase()
                          ? "selected"
                          : ""
                      }>${esc(h || msg`Column ${i + 1}`)}</option>`,
                  )
                  .join("")}</select></label>`,
            )
            .join(
              "",
            )}</div><p>${parsed.rows.length - 1} rows read. A debit and credit column must be mapped; unused row values may be blank.</p>`;
        document.querySelector("#statement-sheet").onchange = async (e) => {
          try {
            parsed = await parse(e.target.value);
            mapping();
            document.querySelector("#statement-preview").innerHTML = "";
          } catch (error) {
            const box = document.querySelector("#statement-form .error");
            box.textContent = error.message;
            box.focus();
          }
        };
      };
      document.querySelector("#read-statement").onclick = async () => {
        const button = document.querySelector("#read-statement"),
          error = document.querySelector("#statement-form .error");
        button.disabled = true;
        parsed = null;
        document.querySelector("#column-mapping").innerHTML = "";
        try {
          const file = document.querySelector("#statement-file").files[0];
          if (file) {
            source = await proof(file);
            buffer = await file.arrayBuffer();
          } else {
            const text = document.querySelector("#manual-statement").value;
            if (!text.trim())
              throw new Error(t("Choose a file or enter CSV rows."));
            const file = new File([text], "manual-statement.csv", {
              type: "text/csv",
            });
            source = await proof(file);
            buffer = await file.arrayBuffer();
          }
          parsed = await parse();
          mapping();
          error.textContent = "";
          document.querySelector("#statement-preview").innerHTML = "";
        } catch (e) {
          error.textContent = e.message;
          error.focus();
        } finally {
          button.disabled = false;
        }
      };
      for (const selector of ["#statement-file", "#manual-statement"])
        document.querySelector(selector).addEventListener("input", () => {
          parsed = null;
          source = null;
          document.querySelector("#column-mapping").innerHTML = "";
        });
      document
        .querySelector("#statement-form")
        .addEventListener("input", () => {
          document.querySelector("#statement-preview").innerHTML = "";
        });
      bindForm("statement-form", async (data) => {
        if (!parsed) throw new Error(t("Read the statement before previewing."));
        const cell = (row, key) => {
          const index = document.querySelector(`#map-${key}`).value;
          return index === "" ? "" : (row[Number(index)] ?? "");
        };
        const day = (value) => {
          if (value === "") return "";
          if (typeof value === "number") {
            const base = Date.UTC(
              parsed.date1904 ? 1904 : 1899,
              parsed.date1904 ? 0 : 11,
              parsed.date1904 ? 1 : 30,
            );
            return new Date(base + value * 86400000).toISOString().slice(0, 10);
          }
          const s = String(value).trim();
          if (data.dateFormat === "DD/MM/YYYY") {
            const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
            if (!m) throw new Error(msg`Invalid DD/MM/YYYY date: ${s}`);
            return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
          }
          return s;
        };
        const amount = (value) => String(value).replace(/[,₹\s]/g, "");
        if (
          document.querySelector("#map-debit").value === "" ||
          document.querySelector("#map-credit").value === ""
        )
          throw new Error(
            t("Map both Debit and Credit columns. Add an empty column for an unused direction."),
          );
        const rows = parsed.rows.slice(1).map((row) => ({
          date: day(cell(row, "date")),
          valueDate: day(cell(row, "valueDate")),
          reference: String(cell(row, "reference")),
          narration: String(cell(row, "narration")),
          debit: amount(cell(row, "debit")),
          credit: amount(cell(row, "credit")),
          balance: amount(cell(row, "balance")),
        }));
        const payload = {
            ...data,
            rows,
            sourceName: source.name,
            sourceData: source.data,
          },
          preview = await api("/statements/preview", {
            method: "POST",
            body: payload,
          });
        document.querySelector("#statement-preview").innerHTML =
          html`<h2>Review ${preview.rows.length} statement rows</h2><p>Opening ${rupees(preview.opening)}, closing ${rupees(preview.closing)}. Duplicate rows: ${preview.duplicates}. Showing the first 20 rows.</p>${table(
            ["Date", "Reference", "Credit / debit", "Balance"],
            preview.rows
              .slice(0, 20)
              .map((row) => [
                esc(row.date),
                esc(row.reference),
                rupees(row.amount),
                rupees(row.balance),
              ]),
          )}${panel("import-confirm", html`<p>Bank: ${esc(nameOf("banks", payload.bankId))}. Period: ${esc(payload.start)} to ${esc(payload.end)}. Original file and mapped values will be retained locally.</p>`, "Import reviewed statement")}`;
        bindForm("import-confirm", async (confirmation) => {
          const saved = await send("/statements/import", {
            ...payload,
            confirm: confirmation.confirm,
          });
          navigate(href(page, { id: saved.id }));
        });
        if (preview.overlaps) {
          const form = document.querySelector("#import-confirm");
          form.querySelector(".error").textContent =
            t("This period overlaps an existing statement for this bank. Choose a separate consecutive period; this import cannot be saved.");
          form.querySelector("button[type=submit]").disabled = true;
        }
      });
      return;
    }
    if (r.id) {
      const statement = await api(`/statements/${r.id}`);
      main.innerHTML =
        head(
          statement.sourceName,
          msg`${nameOf("banks", statement.bankId)}, ${statement.start} to ${statement.end}`,
          html`<a class="button" href="/api/statements/${statement.id}/source" download>Download original evidence</a>`,
        ) +
        html`<p>Opening ${rupees(statement.opening)}, closing ${rupees(statement.closing)}. ${statement.lines.filter((l) => l.status === "Matched").length} of ${statement.lines.length} lines matched.</p>` +
        table(
          [
            "Date",
            "Reference / narration",
            "Credit / debit",
            "Status",
            "Action",
          ],
          statement.lines.map((l) => [
            esc(l.date),
            html`${esc(l.reference)}<small>${esc(l.narration)}</small>`,
            rupees(l.amount),
            html`${esc(t(l.status))}<small>Remaining ${rupees(l.remaining)}</small>`,
            html`<a class="button quiet" href="${href(page, { line: l.id })}">Review line</a>`,
          ]),
        ) +
        (await history(r.id));
      return;
    }
    const imports = await api("/statements");
    main.innerHTML =
      head(
        t("Bank reconciliation"),
        t("Import statement evidence and match it to posted bank-book movements."),
        html`<a class="button primary" href="${href(page, { new: "1" })}">Import statement</a>`,
      ) +
      table(
        ["Source", "Bank", "Period", "Action"],
        imports.map((s) => [
          esc(s.sourceName),
          esc(nameOf("banks", s.bankId)),
          `${s.start} to ${s.end}`,
          html`<a class="button quiet" href="${href(page, { id: s.id })}">Open statement</a>`,
        ]),
      );
    return;
  }
  if (page === "bankmovements") {
    const list = await api("/bankmovements"),
      record = list.find((x) => x.id === r.id);
    if (r.create) {
      const original = list.find((x) => x.id === params.get("reverse"));
      main.innerHTML =
        head(
          original ? t("Reverse bank adjustment") : t("Other bank movement"),
          t("Charges and other movements change the bank book but never create receipt funding."),
        ) +
        panel(
          "movement-form",
          html`<div class="form-grid">${field(F("bankId", "Bank account", "banks", true), original?.bankId || "")}${field(F("date", "Date", "date", true))}${field(F("category", "Category", "select", true, ["Bank charge", "Interest", "Other debit", "Other credit"]), original ? (original.amount > 0 ? "Other debit" : "Other credit") : "Bank charge")}${field(F("amount", "Amount (INR)", "decimal", true), original ? Math.abs(original.amount) : "")}${field(F("reference", "Bank evidence reference", "text", true))}${reasonField()}</div>`,
          "Post bank movement",
        );
      bindForm("movement-form", async (data) => {
        data.reversalOf = original?.id;
        const saved = await send("/bankmovements", data);
        navigate(href(page, { id: saved.id }));
      });
      return;
    }
    if (record) {
      main.innerHTML =
        head(
          record.ref,
          msg`${t(record.category)}, ${record.date}`,
          !record.reversalOf && !list.some((x) => x.reversalOf === record.id)
            ? html`<a class="button" href="${href(page, { new: "1", reverse: record.id })}">Reverse adjustment</a>`
            : "",
        ) +
        html`<dl class="details"><div><dt>Bank</dt><dd>${esc(nameOf("banks", record.bankId))}</dd></div><div><dt>Credit / debit</dt><dd>${rupees(record.amount)}</dd></div><div><dt>Evidence reference</dt><dd>${esc(record.reference)}</dd></div><div><dt>Reason</dt><dd>${esc(record.reason)}</dd></div></dl>` +
        (await history(record.id));
      return;
    }
    main.innerHTML =
      head(
        t("Other bank movements"),
        t("Record evidenced bank charges, interest and other movements without inventing receipt funds."),
        html`<a class="button primary" href="${href(page, { new: "1" })}">Record bank movement</a>`,
      ) +
      table(
        ["Reference", "Bank", "Date", "Credit / debit", "Action"],
        list.map((m) => [
          esc(m.ref),
          esc(nameOf("banks", m.bankId)),
          esc(m.date),
          rupees(m.amount),
          html`<a class="button quiet" href="${href(page, { id: m.id })}">Open</a>`,
        ]),
      );
    return;
  }
  if (page === "periods") {
    const list = await api("/periods");
    main.innerHTML =
      head(
        t("Reconciled periods"),
        t("Lock only fully matched periods whose statement opening and closing agree with the bank book."),
      ) +
      panel(
        "period-form",
        html`<div class="form-grid">${field(F("bankId", "Bank account", "banks", true))}${field(F("start", "Period start", "date", true))}${field(F("end", "Period end", "date", true))}${reasonField()}</div><p>A lock also protects earlier balances and historical tax records for this Society. Reopen later periods first when a correction is required.</p>`,
        "Lock reconciled period",
      ) +
      table(
        ["Bank", "Period", "Status", "Action"],
        list.map((p) => [
          esc(nameOf("banks", p.bankId)),
          `${p.start} to ${p.end}`,
          esc(t(p.status)),
          p.status === "Locked"
            ? html`<button type="button" data-reopen="${p.id}">Reopen</button>`
            : "Retained in history",
        ]),
      ) +
      markup('<div id="reopen-panel"></div>');
    bindForm("period-form", async (data) => {
      await send("/periods", data);
      navigate(href(page));
    });
    document.querySelectorAll("[data-reopen]").forEach(
      (button) =>
        (button.onclick = () => {
          const period = list.find((p) => p.id === button.dataset.reopen);
          document.querySelector("#reopen-panel").innerHTML = panel(
            "reopen-form",
            reasonField(),
            "Confirm reopening",
          );
          bindForm("reopen-form", async (data) => {
            await send(`/periods/${period.id}/reopen`, {
              ...data,
              revision: period.revision,
            });
            navigate(href(page));
          });
        }),
    );
    return;
  }
  if (page === "taxrules") {
    const rules = await api("/taxrules");
    main.innerHTML =
      head(
        t("Tax treatments"),
        t("Configure only accountant-confirmed rates and bases. No rate, including 2%, is assumed."),
      ) +
      panel(
        "rule-form",
        html`<div class="form-grid">${field(F("societyId", "Society", "societies", true))}${field(F("taxType", "Tax treatment name", "text", true))}${field(F("rate", "Confirmed rate (%)", "decimal", true))}${field(F("effectiveFrom", "Effective from", "date", true))}${field(F("basis", "Calculation basis", "textarea", true))}${field(F("evidenceReference", "Accountant confirmation / evidence reference", "text", true))}${reasonField()}</div><p>Versions are immutable. A later effective date supersedes an earlier version without rewriting existing tax records.</p>`,
        "Save tax treatment",
      ) +
      table(
        ["Society", "Treatment", "Rate", "Effective from", "Basis"],
        rules.map((x) => [
          esc(nameOf("societies", x.societyId)),
          esc(x.taxType),
          `${(x.rate / 100).toFixed(2)}%`,
          esc(x.effectiveFrom),
          esc(x.basis),
        ]),
      );
    bindForm("rule-form", async (data) => {
      await send("/taxrules", data);
      navigate(href(page));
    });
    return;
  }
  if (page === "tax") {
    const rules = await api("/taxrules"),
      receipts = await api("/receipts");
    if (r.create) {
      main.innerHTML =
        head(
          t("New tax record"),
          t("Tax deductions, credits and set-off are separate from bank cash and receipt funding."),
        ) +
        panel(
          "tax-form",
          html`<div class="form-grid">${field(F("societyId", "Society", "societies", true))}${field(F("projectId", "Project", "projects", true))}${field(F("date", "Tax date", "date", true))}<label>Tax treatment (required)<select id="rule-id" name="ruleId" required><option value="">Select treatment</option>${rules.map((x) => html`<option value="${x.id}">${esc(nameOf("societies", x.societyId))}, ${esc(x.taxType)}, ${(x.rate / 100).toFixed(2)}%, from ${x.effectiveFrom}</option>`).join("")}</select></label><label>Linked receipt<select name="receiptId"><option value="">No receipt link</option>${receipts
            .filter((x) => x.status === "Posted")
            .map((x) => html`<option value="${x.id}">${esc(x.paymentId)}</option>`)
            .join(
              "",
            )}</select></label>${field(F("reference", "Certificate / tax ledger reference", "text", true))}${field(F("base", "Tax base (INR)", "decimal", true))}${field(F("expected", "Expected tax override (INR), optional", "decimal"))}${field(F("deducted", "Deducted from bill (INR)", "decimal"), "0")}${field(F("bankAmount", "Linked bank amount annotation (INR)", "decimal"), "0")}${field(F("initialStatus", "Initial status", "select", true, ["Expected", "Deducted", "Credit Pending", "Disputed"]))}${field(F("reason", "Override reason (required when expected differs)", "textarea"))}</div><p>Leave the expected override empty to calculate base × the selected rate, rounded half-up to one paise. Bank annotations never create cash; link the actual receipt if recording one.</p>${fileField()}`,
          "Create tax record",
        );
      bindForm("tax-form", async (data, form) => {
        data.evidence = await proof(form.elements.evidence.files[0]);
        const saved = await send("/tax", data);
        navigate(href(page, { id: saved.id }));
      });
      return;
    }
    if (r.id) {
      const record = await api(`/tax/${r.id}`);
      main.innerHTML =
        head(record.ref, msg`${record.taxType}, ${t(record.status)}`) +
        html`<p>${esc(nameOf("societies", record.societyId))}, ${esc(nameOf("projects", record.projectId))}. ${record.receiptId ? html`<a href="${href("receipts", { id: record.receiptId })}">Linked receipt</a>` : ""}</p><dl class="details">${[
          ["Tax base", rupees(record.base)],
          ["Rate", `${(record.rate / 100).toFixed(2)}%`],
          ["Calculated", rupees(record.calculated)],
          ["Expected", rupees(record.expected)],
          ["Deducted", rupees(record.deducted)],
          ["Credited", rupees(record.credited)],
          ["Set off", rupees(record.used)],
          ["Available tax credit", rupees(record.available)],
          ["Bank annotation only", rupees(record.bankAmount)],
          ["Calculation basis", record.basis],
          ["Method", t(record.method)],
          ["Reference", record.reference],
        ]
          .map(([k, v]) => html`<div><dt>${esc(t(k))}</dt><dd>${esc(v)}</dd></div>`)
          .join(
            "",
          )}</dl><p class="notice">Tax credit is not cash and cannot fund a payment.</p><section class="finance-section"><h2>Evidence</h2><ul>${record.evidence.map((f) => html`<li><a href="/api/tax/${record.id}/evidence/${f.id}" download>${esc(t(f.purpose || "Tax evidence"))}: ${esc(f.reference || record.reference)} — ${esc(f.name)}</a></li>`).join("")}</ul><h2>Tax events</h2>${table(
          ["Date", "Event", "Amount", "Reference"],
          record.events.map((e) => [
            esc(e.date),
            esc(t(e.kind)),
            rupees(e.amount),
            esc(e.reference),
          ]),
        )}</section>` +
        panel(
          "tax-event",
          html`<h2>Record tax event</h2><div class="form-grid">${field(F("kind", "Event type", "select", true, ["Credit", "Set-off", "Adjustment increase", "Adjustment decrease", "Status"]))}${field(F("date", "Event date", "date", true))}${field(F("amount", "Amount (INR)", "decimal"), "0")}${field(F("status", "Status for status event", "select", false, ["Expected", "Deducted", "Credit Pending", "Disputed"]))}${field(F("reference", "Event evidence reference", "text", true))}${reasonField()}</div>${fileField()}<p>Events are append-only. Set-off and decreases cannot exceed available credit. A status event records no amount.</p>`,
          "Record tax event",
        ) +
        (await history(record.id));
      const eventForm = document.querySelector("#tax-event");
      const updateEventFields = () => {
        const statusOnly = eventForm.elements.kind.value === "Status";
        eventForm.elements.status.disabled = !statusOnly;
        eventForm.elements.status.required = statusOnly;
        eventForm.elements.amount.disabled = statusOnly;
        eventForm.elements.amount.required = !statusOnly;
      };
      eventForm.elements.kind.addEventListener("change", updateEventFields);
      updateEventFields();
      bindForm("tax-event", async (data, form) => {
        data.evidence = await proof(form.elements.evidence.files[0]);
        await send(`/tax/${record.id}/events`, data);
        navigate(location.href);
      });
      return;
    }
    const all = await api("/tax"),
      list = all.filter(
        (t) =>
          (!r.society || t.societyId === r.society) &&
          (!r.status || t.status === r.status) &&
          `${t.ref} ${t.reference} ${t.taxType}`
            .toLowerCase()
            .includes(r.q.toLowerCase()),
      );
    main.innerHTML =
      head(
        t("Tax register"),
        t("Expected, deducted, credited and set-off amounts are shown separately. None changes bank cash."),
        html`<a class="button primary" href="${href(page, { new: "1" })}">New tax record</a>`,
      ) +
      html`<p><a href="${href("taxrules")}">Configure tax treatments</a></p><form id="tax-filter" class="toolbar"><label>Search tax records<input name="q" value="${esc(r.q)}"></label><label>Society<select name="society"><option value="">All Societies</option>${records.societies.map((s) => html`<option value="${s.id}" ${r.society === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></label><label>Status<select name="status"><option value="">All statuses</option>${["Expected", "Deducted", "Credit Pending", "Credited", "Partly Set Off", "Fully Set Off", "Disputed"].map((s) => html`<option value="${esc(s)}" ${s === r.status ? "selected" : ""}>${esc(t(s))}</option>`).join("")}</select></label><button type="submit">Apply filters</button></form>` +
      table(
        [
          "Reference / treatment",
          "Expected",
          "Deducted",
          "Credited",
          "Set off",
          "Available",
          "Status",
        ],
        list.map((tax) => [
          html`<a href="${href(page, { id: tax.id })}">${esc(tax.ref)}</a><small>${esc(tax.taxType)}</small>`,
          rupees(tax.expected),
          rupees(tax.deducted),
          rupees(tax.credited),
          rupees(tax.used),
          rupees(tax.available),
          esc(t(tax.status)),
        ]),
      );
    document.querySelector("#tax-filter").onsubmit = (e) => {
      e.preventDefault();
      navigate(href(page, Object.fromEntries(new FormData(e.target))));
    };
  }
}
