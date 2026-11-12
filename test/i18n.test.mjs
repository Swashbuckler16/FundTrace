import test from "node:test";
import assert from "node:assert/strict";
import { messages } from "../public/languages.js";
globalThis.localStorage = { getItem: () => "mr", setItem() {} };
const { t, html, msg, setLanguage, getLanguage } =
  await import("../public/i18n.js");
globalThis.document = { documentElement: {} };

test("both translation catalogs preserve every placeholder", () => {
  const slots = (value) =>
    [...value.matchAll(/\{\d+\}/g)].map((m) => m[0]).sort();
  for (const [key, translations] of Object.entries(messages)) {
    assert.equal(translations.length, 2, key);
    for (const value of translations) {
      assert(value?.trim(), key);
      assert.deepEqual(slots(value), slots(key), key);
      assert(!/[<>]/.test(value), key);
    }
  }
});
test("translation affects display copy, never interpolated user data or option values", () => {
  for (const language of ["mr", "hi"]) {
    setLanguage(language);
    assert.notEqual(t("Active"), "Active");
    assert.equal(html`<p>${"Active"}</p>`, "<p>Active</p>");
    assert.equal(
      html`<option value="Active">Active</option>`,
      `<option value="Active">${t("Active")}</option>`,
    );
    assert.equal(
      html`<input value="Draft" placeholder="Name" />`,
      `<input value="Draft" placeholder="${t("Name")}" />`,
    );
    assert.equal(msg`Open ${"Active"}`, t("Open {0}").replace("{0}", "Active"));
    assert.equal(html`<p>${"&lt;script&gt;"}</p>`, "<p>&lt;script&gt;</p>");
  }
  setLanguage("en");
  assert.equal(html`<p>Active ${123}</p>`, "<p>Active 123</p>");
  assert.throws(() => setLanguage("xx"));
  assert.equal(getLanguage(), "en");
});
