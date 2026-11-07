export const kinds = [
  "societies",
  "departments",
  "projects",
  "banks",
  "beneficiaries",
];
export const prefixes = {
  societies: "SOC",
  departments: "DEP",
  projects: "PRJ",
  banks: "BNK",
  beneficiaries: "BEN",
};
export class AppError extends Error {
  constructor(status, message, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
export function demand(condition, message, status = 400, fields = {}) {
  if (!condition) throw new AppError(status, message, fields);
}
export function text(value, label, required = false, max = 240) {
  demand(value == null || typeof value === "string", `${label} must be text.`);
  const s = (value || "").trim();
  demand(!required || s.length > 0, `${label} is required.`, 400, {
    [label]: "Required",
  });
  demand(s.length <= max, `${label} must be ${max} characters or fewer.`);
  return s;
}
export function money(value, label = "Amount") {
  const s = String(value ?? "0");
  demand(
    /^\d{1,12}(\.\d{1,2})?$/.test(s),
    `${label} must be non-negative with no more than two decimal places.`,
  );
  const [whole, fraction = ""] = s.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
export function date(value, label, required = false) {
  const s = text(value, label, required, 10);
  if (s)
    demand(
      /^\d{4}-\d{2}-\d{2}$/.test(s) &&
        Number.isFinite(Date.parse(s)) &&
        new Date(s).toISOString().slice(0, 10) === s,
      `${label} must be a valid date.`,
    );
  return s;
}
function indiaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
export function financialYear(day = indiaToday()) {
  date(day, "Date", true);
  const year = Number(day.slice(0, 4)) - (Number(day.slice(5, 7)) < 4 ? 1 : 0);
  return `${String(year).slice(-2)}-${String(year + 1).slice(-2)}`;
}
export function email(value) {
  const s = text(value, "Email", true, 254).toLowerCase();
  demand(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), "Enter a valid email address.");
  return s;
}
export function validate(kind, raw) {
  demand(
    raw && typeof raw === "object" && !Array.isArray(raw),
    "Record must be an object.",
  );
  demand(kinds.includes(kind), "Unknown master type.", 404);
  const d = {
    name: text(raw.name, "Name", true, 160),
    status: text(raw.status || "Active", "Status"),
  };
  demand(
    ["Active", "Inactive"].includes(d.status),
    "Status must be Active or Inactive.",
  );
  const strings = {
    societies: [
      "code",
      "registration",
      "gstin",
      "chairman",
      "phone",
      "securityName",
      "securityPhone",
      "address",
      "notes",
    ],
    departments: [
      "type",
      "division",
      "subdivision",
      "address",
      "contact",
      "phone",
      "email",
    ],
    projects: [
      "societyId",
      "departmentId",
      "workOrder",
      "location",
      "description",
      "projectStatus",
      "notes",
    ],
    banks: [
      "societyId",
      "bankName",
      "branch",
      "accountNumber",
      "ifsc",
      "accountType",
    ],
    beneficiaries: [
      "societyId",
      "category",
      "phone",
      "address",
      "pan",
      "gstin",
      "accountName",
      "accountNumber",
      "ifsc",
      "sharedAccountReason",
    ],
  };
  for (const key of strings[kind])
    d[key] = text(
      raw[key],
      key,
      false,
      ["notes", "description", "address"].includes(key) ? 2000 : 240,
    );
  for (const key of ["phone", "securityPhone"])
    if (d[key])
      demand(/^\+?[\d ()-]{7,20}$/.test(d[key]), `Enter a valid ${key}.`);
  if (d.email) d.email = email(d.email);
  for (const key of ["gstin", "pan", "ifsc"])
    if (d[key]) d[key] = d[key].toUpperCase();
  if (d.gstin)
    demand(
      /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(d.gstin),
      "GSTIN format is invalid.",
    );
  if (d.pan)
    demand(/^[A-Z]{5}\d{4}[A-Z]$/.test(d.pan), "PAN format is invalid.");
  if (d.accountNumber)
    demand(
      /^\d{6,24}$/.test(d.accountNumber),
      "Account number must contain 6–24 digits.",
    );
  if (d.ifsc)
    demand(
      /^[A-Z]{4}0[A-Z0-9]{6}$/.test(d.ifsc),
      "IFSC must contain 11 characters (for example SBIN0001234).",
    );
  if (["banks", "projects", "beneficiaries"].includes(kind))
    demand(d.societyId, "Select a Society.");
  if (kind === "societies") {
    d.code = d.code.toUpperCase();
    demand(
      /^[A-Z0-9]{2,8}$/.test(d.code),
      "Society code must contain 2–8 letters or digits.",
    );
    d.gstApplicable = raw.gstApplicable === true;
    d.gstRate = money(raw.gstRate || "0", "GST rate");
    demand(d.gstRate <= 10000, "GST rate cannot exceed 100%.");
    d.effectiveDate = date(raw.effectiveDate, "Effective date", true);
  }
  if (["societies", "projects"].includes(kind)) {
    d.workingPercent = money(raw.workingPercent || "0", "Working percentage");
    demand(d.workingPercent <= 10000, "Working percentage cannot exceed 100%.");
  }
  if (kind === "projects") {
    demand(
      d.departmentId && d.workOrder,
      "Department and work order number are required.",
    );
    d.contractValue = money(raw.contractValue, "Contract value");
    for (const key of [
      "workOrderDate",
      "startDate",
      "expectedEnd",
      "completionDate",
    ])
      d[key] = date(raw[key], key, key === "workOrderDate");
    if (d.startDate && d.expectedEnd)
      demand(
        d.expectedEnd >= d.startDate,
        "Expected end must be on or after start date.",
      );
    demand(
      ["Draft", "In Progress", "Completed", "On Hold", "Closed"].includes(
        d.projectStatus,
      ),
      "Select a project status.",
    );
  }
  if (kind === "banks") {
    demand(
      d.bankName && d.accountNumber && d.ifsc,
      "Bank name, account number and IFSC are required.",
    );
    d.openingBalance = money(raw.openingBalance, "Opening balance");
    d.openingDate = date(raw.openingDate, "Opening date", true);
    demand(
      ["Current", "Savings", "Other"].includes(d.accountType),
      "Select an account type.",
    );
  }
  if (kind === "beneficiaries") {
    demand(
      [
        "Supplier",
        "Sub-contractor",
        "Labour contractor",
        "Individual labourer",
      ].includes(d.category),
      "Select a beneficiary category.",
    );
    if (d.accountNumber || d.ifsc || d.accountName)
      demand(
        d.accountNumber && d.ifsc && d.accountName,
        "Provide all beneficiary bank details, or leave all three empty.",
      );
  }
  return d;
}
