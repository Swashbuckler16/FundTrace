const app = document.querySelector("#app");
let records = {},
  renderVersion = 0;
const titles = {
  overview: "Workspace overview",
  receipts: "Government receipts",
  bankbook: "Bank book",
  societies: "Societies",
  departments: "Departments",
  projects: "Projects & work orders",
  banks: "Bank accounts",
  beneficiaries: "Beneficiaries",
  audit: "Audit history",
  numbering: "Numbering",
};
const singular = {
  societies: "Society",
  departments: "department",
  projects: "project",
  banks: "bank account",
  beneficiaries: "beneficiary",
};
const icons = {
  overview: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  receipts: "M5 3h14v18l-3-2-4 2-4-2-3 2zM8 8h8m-8 4h8",
  bankbook: "M3 4h8l1 2 1-2h8v16h-8l-1 2-1-2H3zM12 6v16",
  societies: "M4 21V7l8-4 8 4v14 M9 21v-5h6v5 M8 9h1m6 0h1M8 12h1m6 0h1",
  departments: "M3 21h18M5 18V9m7 9V9m7 9V9M3 6l9-4 9 4z",
  projects: "M3 7h7l2 2h9v11H3z M3 7V4h7l2 3",
  banks: "M3 6l9-4 9 4H3zM3 21h18M6 9v9m6-9v9m6-9v9",
  beneficiaries:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M18 8a3 3 0 0 1 0 6m4 7v-2a4 4 0 0 0-3-4",
  audit: "M12 8v5l3 2M21 12a9 9 0 1 1-3-6M21 3v6h-6",
  numbering: "M5 4h14v16H5zM9 8h6m-6 4h6m-6 4h3",
};
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
const icon = (name) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name] || icons.projects}"/></svg>`;
const rupees = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n / 100,
  );
const when = (s) =>
  new Date(s).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
const route = () => {
  const u = new URL(location.href);
  return {
    page: u.searchParams.get("page") || "overview",
    id: u.searchParams.get("id"),
    edit: u.searchParams.has("edit"),
    create: u.searchParams.has("new"),
    q: u.searchParams.get("q") || "",
    status: u.searchParams.get("status") || "",
    society: u.searchParams.get("society") || "",
  };
};
const href = (page, args = {}) => `/?${new URLSearchParams({ page, ...args })}`;
async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-FundTrace-Local": "1",
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error(
      "Could not reach the local workspace. Start FundTrace on this computer and try again.",
    );
  }
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error);
  }
  return result;
}
function errorBox(message) {
  return `<div class="error" role="alert" tabindex="-1">${esc(message)}</div>`;
}
function bindForm(id, callback) {
  const form = document.getElementById(id);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = form.querySelector(".error");
    error.innerHTML = "";
    form.querySelectorAll(".field-error").forEach((e) => e.remove());
    const invalid = [...form.elements].filter(
      (el) => el.willValidate && !el.checkValidity(),
    );
    [...form.elements]
      .filter((el) => el.willValidate)
      .forEach((el) => el.removeAttribute("aria-invalid"));
    if (invalid.length) {
      error.innerHTML = `Check the following fields: <ul>${invalid.map((el) => `<li><a href="#${el.id}">${esc(el.labels?.[0]?.childNodes[0]?.textContent || el.name)}: ${esc(el.validationMessage)}</a></li>`).join("")}</ul>`;
      invalid.forEach((el) => {
        el.setAttribute("aria-invalid", "true");
        const hint = document.createElement("span");
        hint.className = "field-error";
        hint.id = `${el.id}-error`;
        hint.textContent = el.validationMessage;
        el.setAttribute("aria-describedby", hint.id);
        el.after(hint);
      });
      error.focus();
      return;
    }
    const submit = form.querySelector("[type=submit]");
    submit.disabled = true;
    submit.setAttribute("aria-busy", "true");
    try {
      await callback(Object.fromEntries(new FormData(form)), form);
    } catch (e) {
      error.innerHTML = esc(e.message);
      error.focus();
    } finally {
      submit.disabled = false;
      submit.removeAttribute("aria-busy");
    }
  });
}
function shell(page) {
  const nav = Object.keys(icons);
  app.innerHTML = `<div class="shell"><aside class="sidebar" id="navigation"><a href="${href("overview")}" class="wordmark"><span class="mark" aria-hidden="true">F</span>FundTrace</a><nav aria-label="Primary">${nav.map((key, i) => `${key === "societies" ? '<p class="nav-caption">Master records</p>' : ""}${key === "audit" ? '<p class="nav-caption">Workspace controls</p>' : ""}<a href="${href(key)}" ${page === key ? 'aria-current="page"' : ""}>${icon(key)}${titles[key]}</a>`).join("")}</nav><div class="sidebar-foot"><strong>Receipt workspace</strong><p>Record bank credits with local evidence.</p></div></aside><div class="workspace"><header class="topbar"><button type="button" class="quiet mobile-menu" id="menu" aria-controls="navigation" aria-expanded="false">Menu</button><span class="muted">Labour Society administration</span><span class="local-mode">Offline workspace <small>Saved on this computer</small></span></header><main id="main" class="content" tabindex="-1"><p role="status">Loading records…</p></main></div></div>`;
  document.querySelector("#menu").onclick = () => {
    const open = document.querySelector("#navigation").classList.toggle("open");
    document.querySelector("#menu").setAttribute("aria-expanded", String(open));
  };
}

const head = (title, description, action = "") =>
  `<div class="page-head"><div><h1>${esc(title)}</h1><p>${esc(description)}</p></div>${action}</div>`;
const addButton = (kind) =>
  `<a class="button primary" href="${href(kind, { new: "1" })}">Add ${singular[kind]}</a>`;
const nameOf = (kind, id) =>
  records[kind]?.find((r) => r.id === id)?.name || "Not specified";
function overview() {
  const steps = [
    [
      "societies",
      "Create your Society",
      "Set up its identity and effective-dated defaults.",
    ],
    [
      "departments",
      "Add a Government department",
      "Keep divisions and office references together.",
    ],
    [
      "banks",
      "Register a bank account",
      "Establish the opening balance and effective date.",
    ],
    [
      "projects",
      "Link your work orders",
      "Connect each project to its Society and department.",
    ],
    [
      "beneficiaries",
      "Add the people you pay",
      "Maintain suppliers, contractors and labourers.",
    ],
  ];
  return (
    head(
      "Your records, ready for work.",
      "Build the foundation for tracing Government receipts to their utilisation.",
      addButton("societies"),
    ) +
    `<div class="summary">${Object.entries(records)
      .map(
        ([kind, list]) =>
          `<a href="${href(kind)}"><strong>${list.length}</strong><span>${titles[kind]}</span></a>`,
      )
      .join(
        "",
      )}</div><section class="onboarding"><h2>Set up your Society workspace</h2><p>Follow the record links below. Your changes are saved with an audit trail.</p><ol class="steps">${steps.map(([kind, title, description], i) => `<li><span>${i + 1}</span><div><h3>${title}</h3><p>${description}</p></div><a class="button quiet" href="${href(kind)}">${records[kind].length ? "View records" : "Open register"}</a></li>`).join("")}</ol></section><p class="notice">Posted receipt credits are available in the bank book. Payments and reconciliation follow in later phases. All records work without internet.</p>`
  );
}
function register(kind, r) {
  const list = records[kind].filter(
    (x) =>
      (!r.status || x.status === r.status) &&
      (!r.society || x.societyId === r.society) &&
      `${x.name} ${x.ref} ${x.workOrder || ""} ${x.code || ""}`
        .toLowerCase()
        .includes(r.q.toLowerCase()),
  );
  const third = {
    societies: "Code",
    departments: "Division",
    projects: "Work order",
    banks: "Account",
    beneficiaries: "Category",
  }[kind];
  return (
    head(
      titles[kind],
      `Maintain ${titles[kind].toLowerCase()} with stable IDs and a recorded change history.`,
      addButton(kind),
    ) +
    `<form id="filter" class="toolbar"><label>Search records<input name="q" value="${esc(r.q)}" placeholder="Name, ID or reference"></label><label>Status<select name="status"><option value="">All statuses</option>${["Active", "Inactive"].map((v) => `<option ${r.status === v ? "selected" : ""}>${v}</option>`).join("")}</select></label>${["projects", "banks", "beneficiaries"].includes(kind) ? `<label>Society<select name="society"><option value="">All Societies</option>${records.societies.map((s) => `<option value="${s.id}" ${r.society === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></label>` : ""}<button type="submit">Apply filters</button></form><div class="section-head"><h2>${list.length} ${list.length === 1 ? "record" : "records"}</h2>${r.q || r.status || r.society ? `<a href="${href(kind)}">Clear filters</a>` : "<small>Private details are masked</small>"}</div>${list.length ? `<div class="table-wrap"><table><thead><tr><th>Name / ID</th><th>${third}</th><th>${["societies", "departments"].includes(kind) ? "Updated" : "Society"}</th><th>Status</th><th>Record</th></tr></thead><tbody>${list.map((x) => `<tr><td><strong>${esc(x.name)}</strong><small>${esc(x.ref)}</small></td><td data-label="${third}">${esc(x.code || x.division || x.workOrder || x.accountNumber || x.category || "Not specified")}</td><td data-label="${["societies", "departments"].includes(kind) ? "Updated" : "Society"}">${esc(["societies", "departments"].includes(kind) ? when(x.updatedAt) : nameOf("societies", x.societyId))}</td><td><span class="status ${x.status === "Inactive" ? "inactive" : ""}">${x.status}</span></td><td><a class="button quiet" href="${href(kind, { id: x.id })}" aria-label="Open ${esc(x.name)}">Open</a></td></tr>`).join("")}</tbody></table></div>` : `<section class="empty">${icon(kind)}<h2>${r.q || r.status || r.society ? "No matching records" : `No ${titles[kind].toLowerCase()} yet`}</h2><p>${r.q || r.status || r.society ? "Change or clear your filters to see more records." : `Add your first ${singular[kind]} to establish a reusable master record.`}</p>${addButton(kind)}</section>`}`
  );
}
// Field schemas are shared by creation, editing and the readable detail view.
const F = (key, label, type = "text", required = false, options) => ({
  key,
  label,
  type,
  required,
  options,
});
const fields = {
  societies: [
    F("name", "Society name", "text", true),
    F("code", "Society code", "text", true),
    F("registration", "Registration number"),
    F("gstin", "GSTIN"),
    F("gstApplicable", "GST applicable", "select", false, ["No", "Yes"]),
    F("gstRate", "GST rate (%)", "decimal"),
    F("workingPercent", "Working percentage (%)", "decimal"),
    F("effectiveDate", "Effective from", "date", true),
    F("chairman", "Chairman name"),
    F("phone", "Chairman phone", "tel"),
    F("securityName", "Security contact name"),
    F("securityPhone", "Security contact phone", "tel"),
    F("address", "Address", "textarea"),
    F("notes", "Configuration notes", "textarea"),
  ],
  departments: [
    F("name", "Department name", "text", true),
    F("type", "Department type", "select", false, [
      "PWD",
      "MHADA",
      "Municipal authority",
      "Other",
    ]),
    F("division", "Division"),
    F("subdivision", "Sub-division"),
    F("contact", "Contact person"),
    F("phone", "Contact phone", "tel"),
    F("email", "Contact email", "email"),
    F("address", "Office address", "textarea"),
  ],
  projects: [
    F("name", "Project name", "text", true),
    F("societyId", "Society", "societies", true),
    F("departmentId", "Department", "departments", true),
    F("workOrder", "Work order number", "text", true),
    F("workOrderDate", "Work order date", "date", true),
    F("contractValue", "Approved contract value (INR)", "decimal", true),
    F("location", "Work location"),
    F("projectStatus", "Project status", "select", true, [
      "Draft",
      "In Progress",
      "Completed",
      "On Hold",
      "Closed",
    ]),
    F("startDate", "Start date", "date"),
    F("expectedEnd", "Expected end date", "date"),
    F("completionDate", "Actual completion date", "date"),
    F("workingPercent", "Working percentage (%)", "decimal"),
    F("description", "Work description", "textarea"),
    F("notes", "Revision / approval notes", "textarea"),
  ],
  banks: [
    F("name", "Account nickname", "text", true),
    F("societyId", "Society", "societies", true),
    F("bankName", "Bank name", "text", true),
    F("branch", "Branch"),
    F("accountNumber", "Account number", "text", true),
    F("ifsc", "IFSC", "text", true),
    F("accountType", "Account type", "select", true, [
      "Current",
      "Savings",
      "Other",
    ]),
    F("openingBalance", "Opening bank balance (INR)", "decimal", true),
    F("openingDate", "Opening balance date", "date", true),
  ],
  beneficiaries: [
    F("name", "Beneficiary name", "text", true),
    F("societyId", "Society", "societies", true),
    F("category", "Category", "select", true, [
      "Supplier",
      "Sub-contractor",
      "Labour contractor",
      "Individual labourer",
    ]),
    F("phone", "Contact phone", "tel"),
    F("pan", "PAN"),
    F("gstin", "GSTIN"),
    F("accountName", "Bank beneficiary name"),
    F("accountNumber", "Account number"),
    F("ifsc", "IFSC"),
    F("address", "Address", "textarea"),
    F("sharedAccountReason", "Shared bank account justification", "textarea"),
  ],
};
function field(f, value = "", editing = false) {
  if (f.type === "decimal" && typeof value === "number")
    value = (value / 100).toFixed(2);
  if (typeof value === "boolean") value = value ? "Yes" : "No";
  let control;
  const attrs = `id="f-${f.key}" name="${f.key}" ${f.required ? "required" : ""}`;
  if (records[f.type])
    control = `<select ${attrs} ${editing && f.key === "societyId" ? "disabled" : ""}><option value="">Select ${f.label.toLowerCase()}</option>${records[
      f.type
    ]
      .filter((x) => x.status === "Active" || x.id === value)
      .map(
        (x) =>
          `<option value="${x.id}" ${x.id === value ? "selected" : ""}>${esc(x.name)}</option>`,
      )
      .join("")}</select>`;
  else if (f.type === "select")
    control = `<select ${attrs}>${f.options.map((v) => `<option ${String(value) === v ? "selected" : ""}>${esc(v)}</option>`).join("")}</select>`;
  else if (f.type === "textarea")
    control = `<textarea ${attrs} maxlength="2000">${esc(value)}</textarea>`;
  else
    control = `<input ${attrs} type="${f.type === "decimal" ? "text" : f.type}" ${f.type === "decimal" ? 'inputmode="decimal" pattern="[0-9]+(\\.[0-9]{1,2})?"' : ""} ${f.key === "accountNumber" ? 'inputmode="numeric"' : ""} ${editing && f.key === "code" ? "readonly" : ""} maxlength="240" value="${esc(value)}" >`;
  return `<label class="${f.type === "textarea" ? "wide" : ""}">${esc(f.label)}${f.required ? " (required)" : ""}${control}${editing && f.key === "code" ? '<small class="field-hint">Cannot change after creation.</small>' : ""}</label>`;
}
function masterFields(kind, record) {
  const input = (f) =>
    field(f, record?.[f.key] ?? (f.type === "decimal" ? "0" : ""), !!record);
  if (kind !== "societies") return fields[kind].map(input).join("");
  return [
    ["Society identity", 0, 4],
    ["Financial settings", 4, 8],
    ["Contacts and notes", 8, 14],
  ]
    .map(
      ([title, start, end]) =>
        `<fieldset class="wide form-section"><legend>${title}</legend><div class="form-grid">${fields[kind].slice(start, end).map(input).join("")}</div></fieldset>`,
    )
    .join("");
}
function masterForm(kind, record) {
  return (
    `<a class="button quiet back" href="${href(kind, record ? { id: record.id } : {})}">Back to ${record ? "record" : "register"}</a>` +
    head(
      `${record ? "Edit" : "Add"} ${singular[kind]}`,
      "Keep the details accurate. Required fields are marked.",
    ) +
    `<form id="master-form" class="form-panel" novalidate>${errorBox("")}<div class="form-grid">${masterFields(kind, record)}${field(F("status", "Status", "select", true, ["Active", "Inactive"]), record?.status || "Active")}${field(F("duplicateReason", "Duplicate-name justification (if needed)", "textarea"))}${record ? field(F("reason", "Reason for change", "textarea", true)) : ""}</div><p class="form-help">${kind === "banks" ? "Use the actual bank opening balance. It is separate from receipt allocation balances." : kind === "societies" ? "GST rate is configuration only. Tax credits never create cash. Society code cannot change after creation." : "Inactive records remain available in history."}</p><div class="form-actions"><button class="primary" type="submit">${record ? "Save changes" : "Create record"}</button><a class="button quiet" href="${href(kind, record ? { id: record.id } : {})}">Cancel</a></div></form>`
  );
}
function readable(f, v) {
  if (f.type === "decimal")
    return ["contractValue", "openingBalance"].includes(f.key)
      ? rupees(v)
      : `${(v / 100).toFixed(2)}%`;
  if (records[f.type]) return nameOf(f.type, v);
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return v || "Not provided";
}
function details(kind, record, history) {
  return (
    `<a class="button quiet back" href="${href(kind)}">Back to register</a>` +
    head(
      record.name,
      `${record.ref}, revision ${record.revision}`,
      `<a class="button primary" href="${href(kind, { id: record.id, edit: "1" })}">Edit record</a>`,
    ) +
    `<div class="section-head"><h2>Record details</h2><button type="button" id="reveal">Reveal masked details</button></div><div id="detail-fields"><dl class="details">${fields[kind].map((f) => `<div><dt>${f.label}</dt><dd>${esc(readable(f, record[f.key]))}</dd></div>`).join("")}<div><dt>Status</dt><dd>${record.status}</dd></div></dl></div><div class="section-head"><h2>Change history</h2><small>Times shown in India Standard Time</small></div>${historyMarkup(history)}`
  );
}
function historyMarkup(history) {
  return history.length
    ? `<ol class="history">${history.map((e) => `<li><strong>${esc(e.action)}</strong><p>${esc(e.actor)} • ${when(e.at)}</p>${e.reason ? `<p>${esc(e.reason)}</p>` : ""}${e.after ? `<details><summary>View recorded changes</summary><pre>${esc(JSON.stringify({ before: e.before, after: e.after }, null, 2))}</pre></details>` : ""}</li>`).join("")}</ol>`
    : '<p class="muted">No audit events are visible for this record.</p>';
}
async function render() {
  const current = ++renderVersion,
    r = route(),
    page = r.page;
  shell(page);
  const main = document.querySelector("#main");
  try {
    const lists = await Promise.all(
      Object.keys(singular).map(async (kind) => [
        kind,
        await api(`/masters/${kind}`),
      ]),
    );
    if (current !== renderVersion) return;
    records = Object.fromEntries(lists);
    if (page === "overview") main.innerHTML = overview();
    else if (page === "receipts") await renderReceipts(main, r);
    else if (page === "bankbook") await renderBankBook(main);
    else if (fields[page]) {
      if (r.create || r.edit) {
        const record = r.id
          ? await api(`/masters/${page}/${r.id}?restricted=true`)
          : null;
        main.innerHTML = masterForm(page, record);
        if (page === "projects" && !record)
          document.getElementById("f-societyId").onchange = (event) => {
            const society = records.societies.find(
              (s) => s.id === event.target.value,
            );
            if (society)
              document.getElementById("f-workingPercent").value = (
                society.workingPercent / 100
              ).toFixed(2);
          };
        bindForm("master-form", async (data) => {
          data.gstApplicable = data.gstApplicable === "Yes";
          if (record) {
            data.revision = record.revision;
            data.societyId = record.societyId;
          }
          const saved = await api(
            `/masters/${page}${record ? `/${record.id}` : ""}`,
            { method: record ? "PUT" : "POST", body: data },
          );
          navigate(href(page, { id: saved.id }));
        });
      } else if (r.id) {
        const [record, history] = await Promise.all([
          api(`/masters/${page}/${r.id}`),
          api(`/audit?entity=${encodeURIComponent(r.id)}`),
        ]);
        main.innerHTML = details(page, record, history);
        const reveal = document.querySelector("#reveal");
        if (reveal)
          reveal.onclick = async () => {
            reveal.disabled = true;
            try {
              const full = await api(
                `/masters/${page}/${r.id}?restricted=true`,
              );
              document.querySelector("#detail-fields").innerHTML =
                `<dl class="details">${fields[page].map((f) => `<div><dt>${f.label}</dt><dd>${esc(readable(f, full[f.key]))}</dd></div>`).join("")}<div><dt>Status</dt><dd>${esc(full.status)}</dd></div></dl>`;
              reveal.textContent = "Detail view recorded";
            } catch (e) {
              reveal.after(
                Object.assign(document.createElement("p"), {
                  textContent: e.message,
                }),
              );
              reveal.disabled = false;
            }
          };
      } else {
        main.innerHTML = register(page, r);
        document.querySelector("#filter").onsubmit = (e) => {
          e.preventDefault();
          navigate(href(page, Object.fromEntries(new FormData(e.target))));
        };
      }
    } else if (page === "audit") {
      const events = await api("/audit");
      main.innerHTML =
        head(
          "Audit history",
          "Latest 250 local events. Changes retain before and after values; sensitive fields are masked.",
        ) + historyMarkup(events);
    } else if (page === "numbering") {
      const n = await api("/numbering");
      main.innerHTML =
        head(
          "Numbering",
          "Immutable master IDs are assigned atomically and never reused.",
        ) +
        `<dl class="details">${Object.keys(singular)
          .map(
            (k) =>
              `<div><dt>${titles[k]}</dt><dd>${esc(n.masters.find((s) => s.key === `master:${k}`)?.value || 0)} IDs issued</dd></div>`,
          )
          .join(
            "",
          )}</dl><div class="section-head"><h2>Transaction numbering</h2></div><p>Receipt: <code>${esc(n.receiptPreview)}</code></p><p>Outward: <code>${esc(n.outwardPreview)}</code></p><p class="notice">Receipt IDs are assigned when posting, using the credit date’s Indian financial year (1 April–31 March). Outward numbering starts in Phase 3.</p>`;
    } else
      throw new Error(
        "This page is not available. Use the navigation to open a workspace page.",
      );
    main.focus({ preventScroll: true });
  } catch (e) {
    main.innerHTML =
      head("Could not open this page", "Your records have not been changed.") +
      errorBox(e.message) +
      `<a class="button" href="${href(page)}">Try again</a>`;
  }
}
function navigate(url) {
  history.pushState({}, "", url);
  renderedLocation = location.pathname + location.search;
  render();
}
document.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (
    link &&
    link.hash &&
    link.pathname === location.pathname &&
    link.search === location.search
  )
    return;
  if (
    link &&
    link.origin === location.origin &&
    link.search &&
    !e.ctrlKey &&
    !e.metaKey &&
    !e.shiftKey &&
    e.button === 0
  ) {
    e.preventDefault();
    navigate(link.href);
  }
});
let renderedLocation = location.pathname + location.search;
window.addEventListener("popstate", () => {
  const next = location.pathname + location.search;
  if (next !== renderedLocation) {
    renderedLocation = next;
    render();
  }
});
render();

const receiptFields = [
  F("societyId", "Society", "societies", true),
  F("departmentId", "Department", "departments"),
  F("projectId", "Project / work order", "projects"),
  F("bankId", "Receiving bank account", "banks"),
  F("billType", "Bill type", "select", false, [
    "RA Bill",
    "Final Bill",
    "Other",
  ]),
  F("billNumber", "Bill number"),
  F("creditDate", "Bank credit date", "date"),
  F("valueDate", "Value date", "date"),
  F("amount", "Credited amount (INR)", "decimal"),
  F("mode", "Payment mode", "select", false, [
    "NEFT",
    "RTGS",
    "IMPS",
    "UPI",
    "Cheque",
    "Other",
  ]),
  F("reference", "UTR / bank reference"),
  F("chequeNumber", "Cheque number"),
  F("narration", "Narration", "textarea"),
  F("grossBill", "Gross bill amount (INR)", "decimal"),
  F("gstDeduction", "GST deduction (INR)", "decimal"),
  F("taxCredit", "Tax credit (INR)", "decimal"),
];
async function renderReceipts(main, r) {
  const add = `<a class="button primary" href="${href("receipts", { new: "1" })}">Record receipt</a>`;
  if (r.create || r.edit) {
    const record = r.id ? await api(`/receipts/${r.id}`) : null;
    if (record && record.status !== "Draft")
      throw new Error("Posted receipts cannot be edited.");
    main.innerHTML =
      head(
        record ? "Edit receipt draft" : "Record Government receipt",
        "Save incomplete details as a draft. Map the project and attach bank evidence before posting.",
      ) +
      `<form id="receipt-form" class="form-panel" novalidate>${errorBox("")}<div class="form-grid">${receiptFields.map((f) => field(f, record?.[f.key] ?? (f.type === "decimal" ? "0" : ""), !!record)).join("")}</div>
      <p class="notice">Only the credited amount creates cash. Gross bill, GST deduction and tax credit are reference information and never increase the bank balance.</p>
      <div class="form-actions"><button type="submit" class="primary">Save draft</button><a class="button quiet" href="${href("receipts", record ? { id: record.id } : {})}">Cancel</a></div></form>`;
    const scopeOptions = () => {
      const society = document.querySelector("#f-societyId").value;
      const department = document.querySelector("#f-departmentId").value;
      for (const [key, kind] of [
        ["projectId", "projects"],
        ["bankId", "banks"],
      ]) {
        const select = document.querySelector(`#f-${key}`),
          value = select.value;
        select.innerHTML =
          '<option value="">To be mapped</option>' +
          records[kind]
            .filter(
              (x) =>
                x.status === "Active" &&
                x.societyId === society &&
                (kind !== "projects" || x.departmentId === department),
            )
            .map(
              (x) =>
                `<option value="${x.id}" ${x.id === value ? "selected" : ""}>${esc(x.name)}${x.workOrder ? ` — ${esc(x.workOrder)}` : ""}</option>`,
            )
            .join("");
      }
    };
    document.querySelector("#f-societyId").onchange = scopeOptions;
    document.querySelector("#f-departmentId").onchange = scopeOptions;
    scopeOptions();
    bindForm("receipt-form", async (data) => {
      if (record) {
        data.societyId = record.societyId;
        data.revision = record.revision;
      }
      const saved = await api(`/receipts${record ? `/${record.id}` : ""}`, {
        method: record ? "PUT" : "POST",
        body: data,
      });
      navigate(href("receipts", { id: saved.id }));
    });
  } else if (r.id) {
    const receipt = await api(`/receipts/${r.id}`),
      history = await api(`/audit?entity=${r.id}`);
    main.innerHTML =
      `<a class="button quiet back" href="${href("receipts")}">Back to receipts</a>` +
      head(
        receipt.paymentId || "Receipt draft",
        `${receipt.status}, Entered ${when(receipt.createdAt)}, Local workspace`,
        receipt.status === "Draft"
          ? `<a class="button" href="${href("receipts", { id: r.id, edit: "1" })}">Edit draft</a>`
          : "",
      ) +
      `<div class="summary"><div><strong>${rupees(receipt.amount)}</strong><span>Bank credit ${receipt.status === "Draft" ? "(draft)" : "(posted)"}</span></div><div><strong>${rupees(receipt.available)}</strong><span>Available for allocation</span></div></div>
      <dl class="details">${receiptFields.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.type === "decimal" ? rupees(receipt[f.key]) : readable(f, receipt[f.key]))}</dd></div>`).join("")}</dl>
      <p class="notice">Tax figures are separate from cash. Allocations start in Phase 3; statement reconciliation starts in Phase 4. ${receipt.status === "Posted" ? "Posted receipts are locked. Reversal controls arrive in Phase 3." : "Drafts do not affect balances or receive a Payment ID."}</p>
      <section><h2>Bank evidence</h2>${receipt.evidence.length ? `<ul>${receipt.evidence.map((f) => `<li><a href="/api/receipts/${r.id}/evidence/${f.id}" download>${esc(f.name)}</a> (${Math.ceil(f.size / 1024)} KB)</li>`).join("")}</ul>` : "<p>No evidence attached yet.</p>"}
      ${receipt.status === "Draft" ? `<form id="evidence-form" class="form-panel" novalidate>${errorBox("")}<label>Evidence file (required)<input id="evidence-file" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg" required></label><p>PDF, PNG or JPEG. Up to 2 MB each, maximum five files. Stored encrypted on this computer.</p><button type="submit">Attach evidence</button></form>` : ""}</section>
      ${
        receipt.status === "Draft"
          ? `<section><h2>Review and post</h2><form id="post-form" class="form-panel" novalidate>${errorBox("")}
      ${receipt.duplicates.length ? `<div class="notice"><strong>Possible duplicate bank credit</strong><ul>${receipt.duplicates.map((d) => `<li><a href="${href("receipts", { id: d.id })}">${esc(d.paymentId)}</a></li>`).join("")}</ul></div><label class="check-label"><input id="override" type="checkbox" name="override" required>I reviewed the matches and confirm this is a separate bank credit (required)</label>${field(F("duplicateReason", "Duplicate override reason", "textarea", true))}` : ""}
      <label class="check-label"><input id="confirm-post" name="confirm" type="checkbox" required>I confirm this amount was credited to the selected bank account (required)</label>
      <p>Posting assigns an immutable Payment ID using the credit date’s financial year and updates the bank book once. Check the amount, dates and evidence carefully.</p><button type="submit" class="primary">Post confirmed receipt</button></form></section>`
          : ""
      }
      <h2>Receipt activity</h2>${historyMarkup(history)}`;
    if (receipt.status === "Draft") {
      bindForm("evidence-form", async (_, form) => {
        const file = form.elements.file.files[0];
        if (!file || file.size > 2 * 1024 * 1024)
          throw new Error("Select an evidence file no larger than 2 MB.");
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.onerror = () => reject(new Error("Could not read this file."));
          reader.readAsDataURL(file);
        });
        await api(`/receipts/${r.id}/evidence`, {
          method: "POST",
          body: { name: file.name, data, revision: receipt.revision },
        });
        navigate(href("receipts", { id: r.id }));
      });
      bindForm("post-form", async (data) => {
        await api(`/receipts/${r.id}/post`, {
          method: "POST",
          body: {
            revision: receipt.revision,
            confirm: data.confirm === "on",
            override: data.override === "on",
            duplicateReason: data.duplicateReason,
          },
        });
        navigate(href("receipts", { id: r.id }));
      });
    }
  } else {
    const list = (await api("/receipts")).filter(
      (x) =>
        (!r.status || x.status === r.status) &&
        (!r.society || x.societyId === r.society) &&
        `${x.paymentId || ""} ${x.billNumber} ${x.reference} ${nameOf("societies", x.societyId)}`
          .toLowerCase()
          .includes(r.q.toLowerCase()),
    );
    main.innerHTML =
      head(
        "Government receipts",
        "Record bank credits, retain evidence and trace every posted rupee.",
        add,
      ) +
      `<form id="receipt-filter" class="toolbar"><label>Search receipts<input name="q" value="${esc(r.q)}" placeholder="Payment ID, bill, UTR or Society"></label><label>Status<select name="status"><option value="">All statuses</option>${["Draft", "Posted"].map((s) => `<option ${r.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></label><label>Society<select name="society"><option value="">All Societies</option>${records.societies.map((s) => `<option value="${s.id}" ${r.society === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></label><button type="submit">Apply filters</button><a href="${href("receipts")}">Clear filters</a></form>` +
      (list.length
        ? `<div class="table-wrap"><table><thead><tr><th>Payment ID / Society</th><th>Credit date</th><th>Credited amount</th><th>Status</th><th>Receipt</th></tr></thead><tbody>${list.map((x) => `<tr><td><strong>${esc(x.paymentId || "Draft — unposted")}</strong><small>${esc(nameOf("societies", x.societyId))}</small></td><td data-label="Credit date">${esc(x.creditDate || "Not entered")}</td><td data-label="Credited amount">${rupees(x.amount)}</td><td><span class="status">${x.status}</span></td><td><a class="button quiet" href="${href("receipts", { id: x.id })}" aria-label="Open ${esc(x.paymentId || "draft " + x.id)}">Open</a></td></tr>`).join("")}</tbody></table></div>`
        : '<section class="empty"><h2>No matching receipts</h2><p>Record a bank credit or change the filters. Drafts never increase cash balances.</p></section>');
    document.querySelector("#receipt-filter").onsubmit = (e) => {
      e.preventDefault();
      navigate(href("receipts", Object.fromEntries(new FormData(e.target))));
    };
  }
}
async function renderBankBook(main) {
  const books = await api("/bank-book");
  main.innerHTML =
    head(
      "Bank book",
      "Opening balances plus posted receipt credits. Drafts and tax credits are excluded. Outward payments arrive in Phase 3.",
    ) +
    (books.length
      ? books
          .map(
            ({
              bank,
              entries,
              balance,
            }) => `<section><div class="section-head"><h2>${esc(bank.name)}, ${esc(nameOf("societies", bank.societyId))}</h2><strong>${rupees(balance)}</strong></div>
    <p>Opening balance ${rupees(bank.openingBalance)} on ${esc(bank.openingDate)}, ${esc(bank.accountNumber)}</p>
    ${entries.length ? `<div class="table-wrap"><table><thead><tr><th>Credit date</th><th>Payment ID</th><th>Credit</th><th>Running balance</th></tr></thead><tbody>${entries.map((e) => `<tr><td data-label="Credit date">${esc(e.credit_date)}</td><td data-label="Payment ID"><a href="${href("receipts", { id: e.receipt_id })}">${esc(e.payment_id)}</a></td><td data-label="Credit">${rupees(e.amount)}</td><td data-label="Running balance">${rupees(e.balance)}</td></tr>`).join("")}</tbody></table></div>` : "<p>No posted receipt credits for this account.</p>"}</section>`,
          )
          .join("")
      : '<section class="empty"><h2>No bank accounts yet</h2><p>Register a bank account with its opening balance to begin.</p></section>');
}
