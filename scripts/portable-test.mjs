import { spawn, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  rmSync,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { once } from "node:events";
import assert from "node:assert/strict";

const app = resolve(process.argv[2] || ""),
  node = join(app, "runtime", "node.exe");
assert(existsSync(node), "Pass the extracted portable FundTrace folder.");
assert(
  !existsSync(join(app, "data")),
  "Distributions must not include workspace data.",
);
assert(
  !existsSync(join(app, "public", ".hallmark")),
  "Distributions must not include design artifacts.",
);
const temporary = mkdtempSync(join(tmpdir(), "fundtrace-portable-")),
  data = join(temporary, "Offline workspace 数据");
const env = { ...process.env, PATH: "", FUNDTRACE_DATA_DIR: data, PORT: "0" };
delete env.FUNDTRACE_KEY;
let child, origin;
async function start() {
  child = spawn(node, [join(app, "src/server.mjs")], {
    env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  await new Promise((done, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Portable startup timeout: ${output}`)),
      15000,
    );
    const exit = (code) => {
      clearTimeout(timer);
      reject(new Error(`Startup exited ${code}: ${output}`));
    };
    child.once("exit", exit);
    child.stderr.on("data", (s) => {
      output += s;
    });
    child.stdout.on("data", (s) => {
      output += s;
      const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) {
        origin = match[0];
        clearTimeout(timer);
        child.off("exit", exit);
        done();
      }
    });
    child.once("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
  });
}
async function stop() {
  if (!child || child.exitCode !== null) return;
  const exited = once(child, "exit");
  child.kill();
  await exited;
  // Windows terminates rather than delivering SIGTERM. Exercise recovery after that crash.
  if (existsSync(`${data}.lock`)) {
    const unlock = spawnSync(
      node,
      [join(app, "scripts/recovery.mjs"), "unlock"],
      { env, encoding: "utf8", windowsHide: true },
    );
    assert.equal(unlock.status, 0, unlock.stderr);
  }
}
const request = async (path, body) => {
  const response = await fetch(
    origin + path,
    body
      ? {
          method: "POST",
          headers: {
            Origin: origin,
            "Content-Type": "application/json",
            "X-FundTrace-Local": "1",
          },
          body: JSON.stringify(body),
        }
      : {},
  );
  assert(
    response.ok,
    `${path}: ${response.status} ${response.ok ? "" : await response.text()}`,
  );
  return response.json();
};
try {
  await start();
  assert.equal((await fetch(origin)).status, 200);
  for (const asset of ["i18n.js", "languages.js", "language-extra.js"]) {
    const response = await fetch(`${origin}/${asset}`);
    assert.equal(response.status, 200, `Bundled translation asset: ${asset}`);
    assert.match(response.headers.get("content-type"), /javascript/);
    assert((await response.text()).length > 100);
  }
  assert.equal(
    (await request("/api/recovery")).backups.length,
    1,
    "Startup creates the first automatic backup",
  );
  const duplicate = spawnSync(node, [join(app, "src/server.mjs")], {
    env,
    encoding: "utf8",
    windowsHide: true,
  });
  assert.notEqual(duplicate.status, 0);
  assert.match(duplicate.stderr, /locked/);
  await request("/api/masters/departments", {
    name: "Offline saved department",
  });
  const backup = await request("/api/backups", { confirm: true });
  await request("/api/masters/departments", { name: "After backup" });
  await stop();
  const restored = spawnSync(
    node,
    [join(app, "scripts/recovery.mjs"), "restore", backup.path],
    { env, input: "RESTORE\n", encoding: "utf8", windowsHide: true },
  );
  assert.equal(restored.status, 0, restored.stdout + restored.stderr);
  assert.match(restored.stdout, /Restore complete/);
  await start();
  const departments = await request("/api/masters/departments");
  assert.equal(departments.length, 1);
  assert.equal(departments[0].name, "Offline saved department");
  const results = {
    runtime: spawnSync(node, ["--version"], {
      env,
      encoding: "utf8",
      windowsHide: true,
    }).stdout.trim(),
    noNodeOnPath: true,
    startupBackup: true,
    duplicateLaunchBlocked: true,
    persistedData: true,
    cliRestore: true,
    crashUnlock: process.platform === "win32",
  };
  mkdirSync("artifacts", { recursive: true });
  writeFileSync(
    "artifacts/phase6-portable-results.json",
    JSON.stringify(results, null, 2),
  );
  console.log(results);
} finally {
  await stop();
  assert.equal(dirname(resolve(temporary)), resolve(tmpdir()));
  rmSync(temporary, { recursive: true, force: true });
}
