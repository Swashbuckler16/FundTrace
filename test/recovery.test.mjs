import test from "node:test";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  rmSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { Store, LOCAL_ACTOR as actor } from "../src/store.mjs";
import { reportFixture } from "./support/report-fixture.mjs";
import { report } from "../src/reports.mjs";
import {
  createBackup,
  verifyBackup,
  restoreBackup,
  lockWorkspace,
  unlockWorkspace,
  backupRoot,
  listBackups,
} from "../src/recovery.mjs";

const cleanup = (path) => {
  assert.equal(dirname(resolve(path)), resolve(tmpdir()));
  rmSync(path, { recursive: true, force: true });
};
test("live WAL backup restores exact financial records, evidence, audit, numbering and key; retains previous workspace", () => {
  const f = reportFixture(),
    target = mkdtempSync(join(tmpdir(), "fundtrace-restored-"));
  let restored, previous;
  try {
    const before = report(f.store, actor, { type: "summary", period: "all" });
    const snapshot = createBackup(f.store);
    assert.equal(verifyBackup(snapshot.path).schema, 4);
    assert.equal(listBackups(f.directory).length, 1);
    f.receipt("55"); // Prove snapshot is independent of subsequent live WAL writes.
    writeFileSync(join(target, "existing.txt"), "preserve me");
    previous = restoreBackup(snapshot.path, target).previous;
    assert.equal(
      readFileSync(join(previous, "existing.txt"), "utf8"),
      "preserve me",
    );
    restored = new Store(target);
    const after = report(restored, actor, { type: "summary", period: "all" });
    assert.deepEqual(after.metrics, before.metrics);
    for (const table of [
      "records",
      "payments",
      "claims",
      "tax_records",
      "evidence",
      "payment_evidence",
      "tax_evidence",
      "series",
    ]) {
      const original = new DatabaseSync(
        join(snapshot.path, "fundtrace.sqlite"),
        { readOnly: true },
      );
      try {
        assert.deepEqual(
          restored.db.prepare(`SELECT * FROM ${table}`).all(),
          original.prepare(`SELECT * FROM ${table}`).all(),
        );
      } finally {
        original.close();
      }
    }
    assert.equal(
      restored.db.prepare("SELECT count(*) n FROM receipts").get().n,
      1,
    );
    assert.equal(
      restored.auditList(actor)[0].action,
      "Workspace restored from backup",
    );
    assert.deepEqual(restored.key, f.store.key);
  } finally {
    restored?.close();
    f.close();
    cleanup(target);
    cleanup(backupRoot(f.directory));
    if (previous) cleanup(previous);
  }
});

test("damaged bytes, wrong keys and future schema fail before replacing any data", () => {
  const f = reportFixture(),
    target = mkdtempSync(join(tmpdir(), "fundtrace-protected-"));
  try {
    writeFileSync(join(target, "keep.txt"), "untouched");
    const snapshot = createBackup(f.store);
    const keyPath = join(snapshot.path, "encryption.key"),
      originalKey = readFileSync(keyPath);
    writeFileSync(keyPath, "0".repeat(64));
    assert.throws(() => restoreBackup(snapshot.path, target), /checksum/);
    const manifestPath = join(snapshot.path, "manifest.json"),
      manifest = JSON.parse(readFileSync(manifestPath));
    manifest.sha256["encryption.key"] = createHash("sha256")
      .update(readFileSync(keyPath))
      .digest("hex");
    writeFileSync(manifestPath, JSON.stringify(manifest));
    assert.throws(() => restoreBackup(snapshot.path, target)); // Matching checksum still cannot hide a wrong key.
    writeFileSync(keyPath, originalKey);
    manifest.schema = 99;
    writeFileSync(manifestPath, JSON.stringify(manifest));
    assert.throws(() => restoreBackup(snapshot.path, target), /Unsupported/);
    assert.equal(readFileSync(join(target, "keep.txt"), "utf8"), "untouched");
    assert(!existsSync(`${target}.lock`));
  } finally {
    f.close();
    cleanup(target);
    cleanup(backupRoot(f.directory));
  }
});

test("exclusive lifecycle lock blocks restore and duplicate servers; live locks cannot be cleared", () => {
  const directory = mkdtempSync(join(tmpdir(), "fundtrace-lock-"));
  const f = reportFixture();
  const release = lockWorkspace(directory);
  try {
    assert.throws(() => lockWorkspace(directory), /locked/);
    assert.throws(() => unlockWorkspace(directory), /still running/);
    const backup = createBackup(f.store);
    assert.throws(() => restoreBackup(backup.path, directory), /locked/);
  } finally {
    release();
    cleanup(directory);
    f.close();
    cleanup(backupRoot(f.directory));
  }
});

test("interrupted restore blocks startup and a verified retry clears the recovery marker", () => {
  const f = reportFixture(),
    parent = mkdtempSync(join(tmpdir(), "fundtrace-interrupted-")),
    target = join(parent, "data");
  try {
    const backup = createBackup(f.store);
    writeFileSync(
      `${target}.restore-pending`,
      "interrupted before final rename",
    );
    assert.throws(() => lockWorkspace(target), /restore was interrupted/);
    assert(!existsSync(target));
    restoreBackup(backup.path, target);
    assert(!existsSync(`${target}.restore-pending`));
    const release = lockWorkspace(target);
    release();
    const restored = new Store(target);
    try {
      assert.equal(restored.receipts().length, 1);
    } finally {
      restored.close();
    }
  } finally {
    f.close();
    cleanup(backupRoot(f.directory));
    cleanup(parent);
  }
});

test("future database versions are refused without schema downgrade", () => {
  const directory = mkdtempSync(join(tmpdir(), "fundtrace-future-"));
  try {
    const store = new Store(directory);
    store.db.exec("PRAGMA user_version=99");
    store.close();
    assert.throws(() => new Store(directory), /newer FundTrace/);
    const db = new DatabaseSync(join(directory, "fundtrace.sqlite"));
    assert.equal(db.prepare("PRAGMA user_version").get().user_version, 99);
    db.close();
  } finally {
    cleanup(directory);
  }
});

test("failed backup verification and manifest writes remove their incomplete snapshots", () => {
  const f = reportFixture(),
    key = f.store.key,
    originalWrite = fs.writeFileSync;
  try {
    f.store.key = Buffer.alloc(32);
    assert.throws(() => createBackup(f.store));
    assert.deepEqual(fs.readdirSync(backupRoot(f.directory)), []);
    f.store.key = key;
    fs.writeFileSync = (path, ...args) => {
      if (String(path).endsWith("manifest.json"))
        throw new Error("Simulated disk full");
      return originalWrite(path, ...args);
    };
    syncBuiltinESMExports();
    assert.throws(() => createBackup(f.store), /Simulated disk full/);
    assert.deepEqual(fs.readdirSync(backupRoot(f.directory)), []);
  } finally {
    fs.writeFileSync = originalWrite;
    syncBuiltinESMExports();
    f.store.key = key;
    f.close();
    cleanup(backupRoot(f.directory));
  }
});

for (const failure of ["original move", "staged move", "rollback"]) {
  test(`restore handles ${failure} failure without losing the original workspace`, () => {
    const f = reportFixture(),
      parent = mkdtempSync(join(tmpdir(), "fundtrace-swap-")),
      target = join(parent, "data");
    const rename = fs.renameSync;
    try {
      fs.mkdirSync(target);
      writeFileSync(join(target, "keep.txt"), "original");
      const backup = createBackup(f.store);
      fs.renameSync = (source, destination) => {
        if (
          (failure === "original move" && source === target) ||
          (failure !== "original move" &&
            String(source).includes(".data-restore-")) ||
          (failure === "rollback" &&
            String(source).includes("-before-restore-"))
        )
          throw new Error("Simulated rename failure");
        return rename(source, destination);
      };
      syncBuiltinESMExports();
      assert.throws(
        () => restoreBackup(backup.path, target),
        /Simulated rename failure/,
      );
      fs.renameSync = rename;
      syncBuiltinESMExports();
      if (failure === "rollback") {
        assert(existsSync(`${target}.restore-pending`));
        assert.throws(() => lockWorkspace(target), /interrupted/);
        const previous = fs
          .readdirSync(parent)
          .find((name) => name.startsWith("data-before-restore-"));
        assert.equal(
          readFileSync(join(parent, previous, "keep.txt"), "utf8"),
          "original",
        );
        restoreBackup(backup.path, target);
        assert(!existsSync(`${target}.restore-pending`));
      } else {
        assert.equal(
          readFileSync(join(target, "keep.txt"), "utf8"),
          "original",
        );
        assert(!existsSync(`${target}.restore-pending`));
        assert.deepEqual(fs.readdirSync(parent), ["data"]);
        const release = lockWorkspace(target);
        release();
      }
    } finally {
      fs.renameSync = rename;
      syncBuiltinESMExports();
      f.close();
      cleanup(backupRoot(f.directory));
      cleanup(parent);
    }
  });
}
