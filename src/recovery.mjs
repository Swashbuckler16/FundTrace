import { DatabaseSync } from "node:sqlite";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  renameSync,
  readdirSync,
  copyFileSync,
  unlinkSync,
  statSync,
  realpathSync,
  openSync,
  readSync,
  closeSync,
  rmSync,
} from "node:fs";
import { resolve, join, dirname, basename } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { demand } from "./domain.mjs";
import { decrypt } from "./security.mjs";
import { Store, LOCAL_ACTOR } from "./store.mjs";

const files = ["fundtrace.sqlite", "encryption.key"];
const hash = (path) => {
  const digest = createHash("sha256"),
    chunk = Buffer.alloc(1024 * 1024),
    file = openSync(path, "r");
  try {
    let bytes;
    while ((bytes = readSync(file, chunk, 0, chunk.length, null)))
      digest.update(chunk.subarray(0, bytes));
    return digest.digest("hex");
  } finally {
    closeSync(file);
  }
};
const stamp = () =>
  new Date().toISOString().replace(/[:.]/g, "-") +
  "-" +
  randomUUID().slice(0, 8);
const canonicalDirectory = (directory) => {
  const absolute = resolve(directory);
  return existsSync(absolute)
    ? realpathSync(absolute)
    : join(realpathSync(dirname(absolute)), basename(absolute));
};
export const backupRoot = (directory) =>
  `${canonicalDirectory(directory)}-backups`;

// One app/maintenance process per workspace. Never guess that an existing lock is stale.
export function lockWorkspace(directory, { restoring = false } = {}) {
  mkdirSync(dirname(resolve(directory)), { recursive: true });
  directory = canonicalDirectory(directory);
  demand(
    restoring || !existsSync(`${directory}.restore-pending`),
    "A restore was interrupted. Run Restore FundTrace.cmd with your trusted backup before starting the workspace.",
  );
  const path = `${directory}.lock`;
  try {
    writeFileSync(
      path,
      JSON.stringify({ pid: process.pid, started: new Date().toISOString() }),
      { flag: "wx", mode: 0o600 },
    );
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    throw new Error(
      `Workspace is locked. Close FundTrace before maintenance. After a crash, run the recovery tool's unlock command. Lock: ${path}`,
    );
  }
  return () => unlinkSync(path);
}

export function unlockWorkspace(directory) {
  const path = `${canonicalDirectory(directory)}.lock`;
  const { pid } = JSON.parse(readFileSync(path, "utf8"));
  demand(
    Number.isInteger(pid) && pid > 0,
    "Invalid lock; inspect it manually.",
  );
  try {
    process.kill(pid, 0);
  } catch (error) {
    if (error.code === "ESRCH") {
      unlinkSync(path);
      return;
    }
    throw error;
  }
  throw new Error(
    `Process ${pid} is still running. Close it before unlocking.`,
  );
}

export function verifyBackup(directory) {
  const manifest = JSON.parse(
    readFileSync(join(directory, "manifest.json"), "utf8"),
  );
  demand(
    manifest.format === "fundtrace-backup" &&
      manifest.version === 1 &&
      manifest.schema === 4,
    "Unsupported backup format or database version.",
  );
  demand(
    Number.isFinite(Date.parse(manifest.createdAt)),
    "Backup date is invalid.",
  );
  for (const file of files)
    demand(
      hash(join(directory, file)) === manifest.sha256?.[file],
      `Backup checksum failed: ${file}`,
    );
  const keyHex = readFileSync(join(directory, "encryption.key"), "utf8").trim();
  demand(/^[a-f\d]{64}$/i.test(keyHex), "Backup encryption key is invalid.");
  const key = Buffer.from(keyHex, "hex");
  const db = new DatabaseSync(join(directory, "fundtrace.sqlite"), {
    readOnly: true,
  });
  try {
    demand(
      db.prepare("PRAGMA user_version").get().user_version === 4,
      "Unsupported database schema.",
    );
    demand(
      db.prepare("PRAGMA integrity_check").get().integrity_check === "ok",
      "Database integrity check failed.",
    );
    demand(
      db.prepare("PRAGMA foreign_key_check").all().length === 0,
      "Database links are damaged.",
    );
    const tables = [
      "records",
      "receipts",
      "evidence",
      "claims",
      "payments",
      "payment_evidence",
      "reversals",
      "statement_imports",
      "statement_lines",
      "reconciliation_exceptions",
      "bank_movements",
      "period_locks",
      "tax_rules",
      "tax_records",
      "tax_events",
      "tax_evidence",
    ];
    // Fixed identifiers only. Check every encrypted payload, including attachments and audit history.
    for (const table of tables)
      for (const row of db.prepare(`SELECT payload FROM ${table}`).iterate())
        decrypt(row.payload, key);
    for (const row of db
      .prepare("SELECT before_json, after_json FROM audit")
      .iterate()) {
      if (row.before_json) decrypt(row.before_json, key);
      if (row.after_json) decrypt(row.after_json, key);
    }
    for (const table of [
      "series",
      "allocations",
      "distributions",
      "bank_entries",
      "reconciliation_links",
    ])
      db.prepare(`SELECT * FROM ${table} LIMIT 0`).all();
  } finally {
    db.close();
  }
  return manifest;
}

export function listBackups(directory) {
  const root = backupRoot(directory);
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("backup-"))
    .map((entry) => {
      const path = join(root, entry.name);
      try {
        const m = JSON.parse(readFileSync(join(path, "manifest.json"), "utf8"));
        return {
          name: entry.name,
          path,
          createdAt: m.createdAt,
          bytes: statSync(join(path, "fundtrace.sqlite")).size,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.name.localeCompare(a.name));
}

export function createBackup(store) {
  const root = backupRoot(store.directory);
  mkdirSync(root, { recursive: true, mode: 0o700 });
  const name = `backup-${stamp()}`,
    staging = join(root, `.pending-${randomUUID()}`),
    destination = join(root, name);
  mkdirSync(staging, { mode: 0o700 });
  try {
    // ponytail: synchronous snapshot/verification pauses local writes; use SQLite's async backup API if measured datasets require it.
    store.db.prepare("VACUUM INTO ?").run(join(staging, files[0]));
    writeFileSync(join(staging, files[1]), store.key.toString("hex"), {
      mode: 0o600,
      flag: "wx",
      flush: true,
    });
    const manifest = {
      format: "fundtrace-backup",
      version: 1,
      schema: 4,
      createdAt: new Date().toISOString(),
      sha256: Object.fromEntries(
        files.map((file) => [file, hash(join(staging, file))]),
      ),
    };
    writeFileSync(
      join(staging, "manifest.json"),
      JSON.stringify(manifest, null, 2),
      { mode: 0o600, flag: "wx", flush: true },
    );
    verifyBackup(staging);
    renameSync(staging, destination);
    return { name, path: destination, createdAt: manifest.createdAt };
  } catch (error) {
    cleanupStaging(staging, root, error);
    throw error;
  }
}

function cleanupStaging(staging, parent, error) {
  if (!staging) return;
  demand(
    dirname(resolve(staging)) === resolve(parent),
    "Unsafe staging cleanup path.",
  );
  try {
    rmSync(staging, { recursive: true, force: true });
  } catch (cleanupError) {
    error.message += ` Incomplete staging folder could not be removed: ${staging}. ${cleanupError.message}`;
  }
}

export function restoreBackup(source, target) {
  source = realpathSync(source);
  mkdirSync(dirname(resolve(target)), { recursive: true });
  target = canonicalDirectory(target);
  demand(
    source !== target &&
      !source.startsWith(target + "/") &&
      !source.startsWith(target + "\\"),
    "Choose a backup outside the workspace data folder.",
  );
  const release = lockWorkspace(target, { restoring: true });
  let previous, staging;
  const marker = `${target}.restore-pending`,
    wasInterrupted = existsSync(marker);
  try {
    const manifest = verifyBackup(source);
    staging = join(
      dirname(target),
      `.${basename(target)}-restore-${randomUUID()}`,
    );
    mkdirSync(staging, { mode: 0o700 });
    for (const file of [...files, "manifest.json"])
      copyFileSync(join(source, file), join(staging, file));
    verifyBackup(staging);
    const restored = new Store(
      staging,
      readFileSync(join(staging, "encryption.key"), "utf8").trim(),
    );
    try {
      restored.audit(
        LOCAL_ACTOR,
        "Workspace restored from backup",
        null,
        null,
        "Local recovery tool confirmation",
        null,
        { backupCreatedAt: manifest.createdAt },
      );
    } finally {
      restored.close();
    }
    // Keep the old directory intact, including WAL and key, even if it was damaged.
    writeFileSync(
      `${target}.restore-pending`,
      JSON.stringify({ source, staging, started: new Date().toISOString() }),
      { mode: 0o600, flush: true },
    );
    const hadTarget = existsSync(target);
    let movedOriginal = false;
    try {
      if (hadTarget) {
        previous = `${target}-before-restore-${stamp()}`;
        renameSync(target, previous);
        movedOriginal = true;
      }
      renameSync(staging, target);
    } catch (error) {
      if (movedOriginal) {
        try {
          renameSync(previous, target);
        } catch (rollbackError) {
          error.message += ` Rollback failed; preserve ${previous} and retry recovery. ${rollbackError.message}`;
          throw error;
        }
      }
      // An ordinary failed swap with its original restored must not strand that workspace.
      if (!wasInterrupted && hadTarget && existsSync(target))
        unlinkSync(marker);
      throw error;
    }
    unlinkSync(marker);
    return {
      restoredAt: new Date().toISOString(),
      source,
      target,
      previous: previous || null,
    };
  } catch (error) {
    // If recovery is still ambiguous, retain staging and its marker for a retry.
    if (!existsSync(marker)) cleanupStaging(staging, dirname(target), error);
    else if (staging)
      error.message += ` Recovery staging retained: ${staging}.`;
    throw error;
  } finally {
    release();
  }
}
