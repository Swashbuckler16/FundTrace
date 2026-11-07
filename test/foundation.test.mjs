import { test } from "node:test";
import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { Store, LOCAL_ACTOR } from "../src/store.mjs";
import { createApp, readRequestBody } from "../src/server.mjs";
import { money, financialYear } from "../src/domain.mjs";

test("request bodies preserve Unicode split across chunks and enforce byte limits", async () => {
  const value = JSON.stringify({
    name: "मजूर सहकारी संस्था",
    note: "₹100 – paid",
  });
  const bytes = Buffer.from(value);
  // Every byte is a separate chunk, including each byte of Devanagari code points.
  assert.equal(
    await readRequestBody([...bytes].map((byte) => Buffer.from([byte]))),
    value,
  );
  await assert.rejects(
    () => readRequestBody([Buffer.alloc(65536), Buffer.alloc(1)]),
    (error) => error.status === 413,
  );
});

test("offline HTTP opens without login and rejects cross-site mutations and DNS rebinding", async (t) => {
  const { store } = await fixture(t);
  const server = createApp(store);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const get = (path) => fetch(origin + path);
  assert.equal((await get("/")).status, 200);
  const response = await get("/api/masters/societies");
  assert.equal(response.status, 200);
  assert.equal((await response.json()).length, 1);
  assert.equal(response.headers.get("set-cookie"), null);
  for (const path of [
    "/api/login",
    "/api/session",
    "/api/users",
    "/api/password",
  ])
    assert.equal((await get(path)).status, 404);
  const post = (headers) =>
    fetch(origin + "/api/masters/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ name: "Offline department" }),
    });
  assert.equal(
    (
      await post({
        Origin: "https://untrusted.example",
        "X-FundTrace-Local": "1",
      })
    ).status,
    403,
  );
  assert.equal((await post({ Origin: origin })).status, 403);
  assert.equal(
    (await post({ Origin: origin, "X-FundTrace-Local": "1" })).status,
    201,
  );
  const reboundStatus = await new Promise((resolve, reject) => {
    const req = httpRequest(
      origin + "/api/audit",
      {
        headers: { Host: `untrusted.example:${server.address().port}` },
      },
      (response) => {
        response.resume();
        resolve(response.statusCode);
      },
    );
    req.on("error", reject);
    req.end();
  });
  assert.equal(reboundStatus, 403);
  assert.match(
    response.headers.get("content-security-policy"),
    /connect-src 'self'/,
  );
  assert.equal(
    store.db
      .prepare(
        "SELECT count(*) n FROM sqlite_master WHERE name IN ('users','sessions','attempts')",
      )
      .get().n,
    0,
  );
});

test("records and local audit history survive a complete store restart", () => {
  const directory = mkdtempSync(join(tmpdir(), "fundtrace-restart-"));
  let store = new Store(directory);
  try {
    const saved = store.save(LOCAL_ACTOR, "societies", null, {
      name: "Persistent Society",
      code: "PERSIST",
      effectiveDate: "2026-04-01",
    });
    store.close();
    store = new Store(directory);
    assert.equal(
      store.detail(LOCAL_ACTOR, "societies", saved.id).ref,
      saved.ref,
    );
    assert.equal(
      store.auditList(LOCAL_ACTOR, saved.id)[0].actor,
      "Local workspace",
    );
  } finally {
    store.close();
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    rmSync(directory, { recursive: true, force: true });
  }
});

async function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "fundtrace-test-"));
  const store = new Store(dir);
  t.after(() => {
    store.close();
    assert.equal(dirname(resolve(dir)), resolve(tmpdir()));
    rmSync(dir, { recursive: true, force: true });
  });
  const actor = LOCAL_ACTOR;
  const society = store.save(actor, "societies", null, {
    name: "Test Society",
    code: "TEST",
    effectiveDate: "2026-04-01",
  });
  return { dir, store, actor, society };
}
test("default financial year rolls over at midnight in India, not UTC", (t) => {
  t.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2026-03-31T18:29:59Z"),
  });
  assert.equal(financialYear(), "25-26");
  t.mock.timers.setTime(Date.parse("2026-03-31T18:30:00Z"));
  assert.equal(financialYear(), "26-27");
});

test("money uses exact paise and rejects silent rounding; Indian FY rolls over on April 1", () => {
  assert.equal(money("1000000.25"), 100000025);
  for (const value of ["1.001", "-1", "NaN", "1e3", "", Infinity])
    assert.throws(() => money(value));
  assert.equal(financialYear("2026-03-31"), "25-26");
  assert.equal(financialYear("2026-04-01"), "26-27");
  assert.throws(() => financialYear("2026-02-30"));
});
test("Society updates preserve ID, code and encrypted before/after history; stale writes rejected", async (t) => {
  const { store, actor, society } = await fixture(t);
  const data = {
    ...store.detail(actor, "societies", society.id, true),
    name: "Renamed Society",
    workingPercent: "5.00",
    reason: "Chairman approved name change",
  };
  const saved = store.save(actor, "societies", society.id, data);
  assert.equal(saved.id, society.id);
  assert.equal(saved.ref, society.ref);
  assert.equal(saved.revision, 2);
  assert.throws(
    () => store.save(actor, "societies", society.id, data),
    /changed since/,
  );
  assert.throws(
    () =>
      store.save(actor, "societies", society.id, {
        ...data,
        revision: 2,
        code: "OTHER",
      }),
    /immutable/,
  );
  const history = store.auditList(actor, society.id);
  const event = history.find((e) => e.action === "Master updated");
  assert.equal(event.before.name, "Test Society");
  assert.equal(event.after.name, "Renamed Society");
  assert.throws(() => store.db.exec("DELETE FROM audit"), /append-only/);
  assert.throws(
    () => store.db.exec("UPDATE audit SET reason='changed'"),
    /append-only/,
  );
});
test("linked department, project, bank and beneficiary masters enforce relationship and duplicate rules", async (t) => {
  const { store, actor, society } = await fixture(t);
  const department = store.save(actor, "departments", null, {
    name: "PWD",
    division: "Pune",
  });
  const p = {
    name: "Test work",
    societyId: society.id,
    departmentId: department.id,
    workOrder: "WO-1",
    workOrderDate: "2026-05-01",
    projectStatus: "Draft",
    contractValue: "1000000.25",
  };
  const project = store.save(actor, "projects", null, p);
  assert.equal(project.contractValue, 100000025);
  assert.throws(() => store.save(actor, "projects", null, p), /already exists/);
  assert.throws(
    () =>
      store.save(actor, "projects", null, { ...p, departmentId: society.id }),
    /active department/,
  );
  const bank = {
    name: "Operating account",
    societyId: society.id,
    bankName: "Example Bank",
    accountNumber: "123456789012",
    ifsc: "SBIN0001234",
    accountType: "Current",
    openingBalance: "1000.25",
    openingDate: "2026-04-01",
  };
  const saved = store.save(actor, "banks", null, bank);
  assert.equal(saved.accountNumber, "•••• 9012");
  assert.throws(
    () => store.save(actor, "banks", null, bank),
    /already registered/,
  );
  assert.throws(
    () => store.save(actor, "banks", null, { ...bank, ifsc: "INVALID" }),
    /IFSC/,
  );
  const beneficiary = {
    name: "Test Supplier",
    societyId: society.id,
    category: "Supplier",
    accountNumber: "987654321098",
    accountName: "Test Supplier",
    ifsc: "SBIN0001234",
  };
  store.save(actor, "beneficiaries", null, beneficiary);
  assert.throws(
    () =>
      store.save(actor, "beneficiaries", null, {
        ...beneficiary,
        name: "Other Supplier",
      }),
    /shared/,
  );
  store.save(actor, "beneficiaries", null, {
    ...beneficiary,
    name: "Other Supplier",
    sharedAccountReason: "Joint account evidence verified",
  });
  assert.throws(
    () =>
      store.save(actor, "beneficiaries", null, {
        ...beneficiary,
        name: "No access",
        societyId: "missing",
      }),
    /existing Society/,
  );
});
test("sensitive fields are encrypted at rest, masked in lists and audited when revealed", async (t) => {
  const { store, actor, society, dir } = await fixture(t);
  const bank = store.save(actor, "banks", null, {
    name: "Operating account",
    societyId: society.id,
    bankName: "Bank",
    accountNumber: "123456789012",
    ifsc: "SBIN0001234",
    accountType: "Current",
    openingDate: "2026-04-01",
  });
  assert.equal(
    store.detail(actor, "banks", bank.id).accountNumber,
    "•••• 9012",
  );
  assert.equal(
    store.detail(actor, "banks", bank.id, true).accountNumber,
    "123456789012",
  );
  assert(
    store
      .auditList(actor, bank.id)
      .some((e) => e.action === "Restricted details viewed"),
  );
  const raw = store.db
    .prepare("SELECT payload FROM records WHERE id=?")
    .get(bank.id).payload;
  assert(!raw.includes("123456789012"));
  store.db.exec("PRAGMA wal_checkpoint(FULL)");
  assert(
    !readFileSync(join(dir, "fundtrace.sqlite")).includes(
      Buffer.from("123456789012"),
    ),
  );
});
test("master numbering persists across connections, never reuses IDs and protects records from moving Society", async (t) => {
  const { store, actor, society, dir } = await fixture(t);
  const secondStore = new Store(dir);
  let second;
  try {
    second = secondStore.save(actor, "societies", null, {
      name: "Second Society",
      code: "SECOND",
      effectiveDate: "2026-04-01",
    });
  } finally {
    secondStore.close();
  }
  assert.notEqual(society.ref, second.ref);
  assert.equal(second.ref, "SOC-000002");
  const beneficiary = store.save(actor, "beneficiaries", null, {
    name: "Test",
    societyId: society.id,
    category: "Supplier",
  });
  assert.throws(
    () =>
      store.save(actor, "beneficiaries", beneficiary.id, {
        ...beneficiary,
        societyId: second.id,
        reason: "Move account",
      }),
    /cannot be moved/,
  );
});
