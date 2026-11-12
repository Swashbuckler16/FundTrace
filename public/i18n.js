import { messages } from "./languages.js";
export const languages = { en: "English", mr: "मराठी", hi: "हिन्दी" };
export const missingTranslations = new Set();
let language = "en";
try {
  const saved = localStorage.getItem("fundtrace-language");
  if (Object.hasOwn(languages, saved)) language = saved;
} catch {}
export const getLanguage = () => language;
export function setLanguage(value) {
  if (!Object.hasOwn(languages, value)) throw new Error("Unknown language");
  try {
    localStorage.setItem("fundtrace-language", value);
  } catch {
    throw new Error(t("Allow browser storage to save your language."));
  }
  language = value;
  document.documentElement.lang = value;
}
const normalize = (value) => String(value).replace(/\s+/g, " ").trim();
const caseKeys = new Map(
  Object.keys(messages).map((key) => [key.toLowerCase(), key]),
);
const patterns = Object.keys(messages)
  .filter((key) => key.includes("{0}") && /[a-zA-Z]/.test(key))
  .map((key) => ({
    key,
    regex: new RegExp(
      "^" +
        key
          .split(/(\{\d+\})/)
          .map((part) =>
            /^\{\d+\}$/.test(part)
              ? "(.+?)"
              : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          )
          .join("") +
        "$",
    ),
  }))
  .sort(
    (a, b) =>
      b.key.replace(/\{\d+\}/g, "").length -
      a.key.replace(/\{\d+\}/g, "").length,
  );
export function t(value) {
  if (typeof value !== "string" || language === "en") return value;
  const key = normalize(value),
    translated =
      messages[key]?.[language === "mr" ? 0 : 1] ||
      messages[caseKeys.get(key.toLowerCase())]?.[language === "mr" ? 0 : 1];
  if (translated)
    return value.match(/^\s*/)[0] + translated + value.match(/\s*$/)[0];
  for (const pattern of patterns) {
    const match = key.match(pattern.regex);
    if (match)
      return messages[pattern.key][language === "mr" ? 0 : 1].replace(
        /\{(\d+)\}/g,
        (_, i) => {
          const value = match[Number(i) + 1];
          // Only validation field labels are translated; record names/references stay verbatim.
          return Number(i) === 0 &&
            (/^\{0\} (is required|must be)/.test(pattern.key) ||
              pattern.key === "Enter a valid {0}.")
            ? t(value)
            : value;
        },
      );
  }
  if (/[A-Za-z]/.test(key)) missingTranslations.add(key);
  return value;
}
function fragment(text) {
  const used = [];
  const key = normalize(text).replace(/\uE000(\d+)\uE001/g, (_, i) => {
    used.push(Number(i));
    return `{${used.length - 1}}`;
  });
  const translated =
    language === "en" ? null : messages[key]?.[language === "mr" ? 0 : 1];
  if (!translated) {
    if (language !== "en" && /[A-Za-z]/.test(key)) missingTranslations.add(key);
    return text;
  }
  return (
    text.match(/^\s*/)[0] +
    translated.replace(
      /\{(\d+)\}/g,
      (_, i) => `\uE000${used[Number(i)]}\uE001`,
    ) +
    text.match(/\s*$/)[0]
  );
}
export function markup(source) {
  if (language === "en") return source;
  return source
    .replace(
      /(^|>)([^<>]+)(?=<|$)/g,
      (_, before, text) => before + fragment(text),
    )
    .replace(
      /(placeholder|aria-label|title|data-label)="([^"]+)"/g,
      (_, attr, text) => `${attr}="${fragment(text)}"`,
    );
}
export function html(strings, ...values) {
  const source = strings
    .map((text, i) => text + (i < values.length ? `\uE000${i}\uE001` : ""))
    .join("");
  return markup(source).replace(/\uE000(\d+)\uE001/g, (_, i) =>
    String(values[Number(i)] ?? ""),
  );
}
export function msg(strings, ...values) {
  const source = strings
    .map((text, i) => text + (i < values.length ? `\uE000${i}\uE001` : ""))
    .join("");
  return fragment(source).replace(/\uE000(\d+)\uE001/g, (_, i) =>
    String(values[Number(i)] ?? ""),
  );
}
export function validationMessage(input) {
  if (language === "en") return input.validationMessage;
  if (input.validity.valueMissing)
    return t(
      input.type === "checkbox"
        ? "Please tick this box to confirm."
        : "Please fill in this field.",
    );
  if (input.validity.rangeUnderflow || input.validity.rangeOverflow)
    return t("Enter a value within the allowed range.");
  return t("Please check this value and enter it again.");
}
if (globalThis.document) {
  document.documentElement.lang = language;
  document.title = `FundTrace | ${t("Funds workspace")}`;
  const skip = document.querySelector(".skip");
  if (skip) skip.textContent = t("Skip to content");
  const loading = document.querySelector(".loading [role=status]");
  if (loading) loading.textContent = t("Opening your workspace…");
}
