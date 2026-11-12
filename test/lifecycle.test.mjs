import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { startWorkspace } from "../src/server.mjs";
import { createConnection } from "node:net";
import { once } from "node:events";

test("shutdown bounds an unfinished request and releases the workspace lock", async () => {
  const root = mkdtempSync(join(tmpdir(), "fundtrace-shutdown-")),
    directory = join(root, "data");
  let workspace, socket;
  try {
    workspace = await startWorkspace(directory, { port: 0 });
    const port = workspace.server.address().port;
    socket = createConnection({ host: "127.0.0.1", port });
    socket.on("error", () => {});
    await once(socket, "connect");
    const request = once(workspace.server, "request");
    socket.write(
      `POST /api/masters/departments HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nOrigin: ${workspace.origin}\r\nX-FundTrace-Local: 1\r\nContent-Type: application/json\r\nContent-Length: 10000\r\n\r\n{`,
    );
    await request;
    const started = Date.now();
    await workspace.stop();
    assert(Date.now() - started < 5000);
    assert(!existsSync(directory + ".lock"));
  } finally {
    socket?.destroy();
    await workspace?.stop();
    assert.equal(dirname(resolve(root)), resolve(tmpdir()));
    rmSync(root, { recursive: true, force: true });
  }
});

test("shared desktop/CLI lifecycle releases locks on exit and failed listen", async () => {
  const root = mkdtempSync(join(tmpdir(), "fundtrace-lifecycle-")),
    first = join(root, "first"),
    second = join(root, "second");
  let workspace;
  try {
    workspace = await startWorkspace(first, { port: 0, desktop: true });
    const state = await (
      await fetch(workspace.origin + "/api/recovery")
    ).json();
    assert.equal(state.desktop, true);
    assert.equal(state.backups.length, 1);
    await assert.rejects(
      startWorkspace(second, { port: workspace.server.address().port }),
      { code: "EADDRINUSE" },
    );
    assert(!existsSync(second + ".lock"));
    await Promise.all([workspace.stop(), workspace.stop()]);
    assert(!existsSync(first + ".lock"));
    workspace = await startWorkspace(first, { port: 0 });
    assert.equal(
      (await (await fetch(workspace.origin + "/api/recovery")).json()).desktop,
      false,
    );
  } finally {
    await workspace?.stop();
    assert.equal(dirname(resolve(root)), resolve(tmpdir()));
    rmSync(root, { recursive: true, force: true });
  }
});
