import { performance } from "node:perf_hooks";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import assert from "node:assert/strict";
import { reportFixture, actor } from "../test/support/report-fixture.mjs";
import { search, report } from "../src/reports.mjs";
import { createBackup, backupRoot } from "../src/recovery.mjs";
const f = reportFixture();
try {
  for (let i = 0; i < 999; i++) f.receipt("1000");
  for (let i = 0; i < 99; i++) {
    const c = f.claim("1");
    f.payment(f.r, c, "1");
  }
  const timings = {};
  for (const [name, operation, ceiling] of [
    [
      "exactPaymentIdMs",
      () => search(f.store, actor, { q: f.r.paymentId }),
      2000,
    ],
    ["receiptListMs", () => f.store.receipts(actor), 3000],
    [
      "summaryMs",
      () => report(f.store, actor, { type: "summary", period: "all" }),
      3000,
    ],
    ["verifiedBackupMs", () => createBackup(f.store), 10000],
  ]) {
    const start = performance.now();
    operation();
    timings[name] = Math.round(performance.now() - start);
    assert(
      timings[name] < ceiling,
      `${name} exceeded ${ceiling}ms: ${timings[name]}`,
    );
  }
  mkdirSync("artifacts", { recursive: true });
  const result = {
    receipts: 1000,
    payments: 100,
    runtime: process.version,
    platform: process.platform,
    timings,
  };
  writeFileSync(
    "artifacts/phase6-performance.json",
    JSON.stringify(result, null, 2),
  );
  console.log(result);
} finally {
  f.close();
  const path = backupRoot(f.directory);
  assert.equal(dirname(resolve(path)), resolve(tmpdir()));
  rmSync(path, { recursive: true, force: true });
}
