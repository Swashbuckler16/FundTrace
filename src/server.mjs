import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Store, LOCAL_ACTOR } from "./store.mjs";
import { AppError, demand, kinds } from "./domain.mjs";
import { report, search, trace, dashboard, reportCatalog } from "./reports.mjs";
import {
  createBackup,
  listBackups,
  backupRoot,
  lockWorkspace,
} from "./recovery.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assets = {
  "/": ["index.html", "text/html"],
  "/app.js": ["app.js", "text/javascript"],
  "/payments.js": ["payments.js", "text/javascript"],
  "/reconciliation.js": ["reconciliation.js", "text/javascript"],
  "/reports.js": ["reports.js", "text/javascript"],
  "/recovery.js": ["recovery.js", "text/javascript"],
  "/i18n.js": ["i18n.js", "text/javascript"],
  "/languages.js": ["languages.js", "text/javascript"],
  "/language-extra.js": ["language-extra.js", "text/javascript"],
  "/statement-worker.js": ["statement-worker.js", "text/javascript"],
  "/vendor/xlsx.full.min.js": ["vendor/xlsx.full.min.js", "text/javascript"],
  "/styles.css": ["styles.css", "text/css"],
  "/tokens.css": ["tokens.css", "text/css"],
  "/base.css": ["base.css", "text/css"],
};

export async function readRequestBody(stream, limit = 65536) {
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    demand(size <= limit, "Request is too large.", 413);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function createApp(store, recovery = {}) {
  return createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    );
    const send = (status, data) => {
      res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(JSON.stringify(data));
    };
    try {
      const port = req.socket.localPort;
      const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
      demand(
        hosts.includes(req.headers.host),
        "Only local workspace requests are allowed.",
        403,
      );
      const allowedOrigins = hosts.map((host) => `http://${host}`);
      if (req.headers.origin)
        demand(
          allowedOrigins.includes(req.headers.origin),
          "Request origin is not allowed.",
          403,
        );
      demand(
        req.headers["sec-fetch-site"] !== "cross-site",
        "Cross-site requests are not allowed.",
        403,
      );
      const actor = LOCAL_ACTOR;
      const url = new URL(req.url, "http://localhost"),
        path = url.pathname;
      if (!path.startsWith("/api/")) {
        demand(req.method === "GET", "Method not allowed.", 405);
        const asset = assets[path];
        demand(asset, "Page not found.", 404);
        const body = await readFile(join(root, "public", asset[0]));
        res.writeHead(200, { "Content-Type": `${asset[1]}; charset=utf-8` });
        res.end(body);
        return;
      }
      let data = {};
      if (!["GET", "HEAD"].includes(req.method)) {
        demand(
          allowedOrigins.includes(req.headers.origin),
          "Request origin is not allowed.",
          403,
        );
        demand(
          req.headers["x-fundtrace-local"] === "1",
          "Use the local FundTrace interface.",
          403,
        );
        demand(
          req.headers["content-type"]?.split(";")[0] === "application/json",
          "Use JSON requests.",
          415,
        );
        const body = await readRequestBody(
          req,
          /^\/api\/statements\/(preview|import)$/.test(path)
            ? 5 * 1024 * 1024
            : /^\/api\/tax(?:\/[\w-]+\/events)?$/.test(path)
              ? 3 * 1024 * 1024
              : /^\/api\/(receipts|payments)\/[\w-]+\/evidence$/.test(path)
                ? 3 * 1024 * 1024
                : 65536,
        );
        try {
          data = JSON.parse(body || "{}");
        } catch {
          throw new AppError(400, "Invalid JSON request.");
        }
        demand(
          data && typeof data === "object" && !Array.isArray(data),
          "Use a JSON object.",
        );
      }
      if (
        req.method === "GET" &&
        [
          "/api/reports",
          "/api/search",
          "/api/dashboard",
          "/api/report-catalog",
          "/api/trace",
        ].includes(path)
      ) {
        const query = Object.fromEntries(url.searchParams);
        send(
          200,
          path === "/api/report-catalog"
            ? reportCatalog
            : path === "/api/reports"
              ? report(store, actor, query)
              : path === "/api/search"
                ? search(store, actor, query)
                : path === "/api/dashboard"
                  ? dashboard(store, actor, query)
                  : trace(store, actor, query.id || ""),
        );
        return;
      }
      if (path === "/api/recovery" && req.method === "GET") {
        send(200, {
          directory: store.directory,
          backupDirectory: backupRoot(store.directory),
          backups: listBackups(store.directory),
          automaticError: recovery.error || null,
        });
        return;
      }
      if (path === "/api/backups" && req.method === "POST") {
        demand(
          data.confirm === true,
          "Confirm that backup folders contain private financial records and their encryption key.",
        );
        const result = createBackup(store);
        recovery.error = null;
        store.audit(actor, "Local backup verified", null, null, "", null, {
          name: result.name,
        });
        send(201, result);
        return;
      }
      if (path === "/api/report-export" && req.method === "POST") {
        demand(
          ["xlsx", "print"].includes(data.format),
          "Unknown export format.",
        );
        const result = report(store, actor, data.filters || {});
        store.audit(
          actor,
          "Report export prepared",
          null,
          result.filters.society || null,
          "",
          null,
          {
            type: result.type,
            format: data.format,
            filters: result.filters,
            rows: result.rows.length,
            generatedAt: result.generatedAt,
          },
        );
        send(200, result);
        return;
      }
      if (path === "/api/bank-book" && req.method === "GET") {
        send(200, store.bankBook(actor));
        return;
      }
      if (path === "/api/reconciliation-movements" && req.method === "GET") {
        send(200, store.reconciliationMovements(url.searchParams.get("bank")));
        return;
      }
      const lineRoute = path.match(
        /^\/api\/statement-(lines|links)\/([\w-]+)(?:\/(match|exception|unmatch))?$/,
      );
      if (lineRoute) {
        const [, kind, id, action] = lineRoute;
        if (req.method === "GET" && kind === "lines" && !action) {
          send(200, store.statementLine(id));
          return;
        }
        if (req.method === "POST") {
          if (kind === "lines" && action === "match") {
            send(200, store.matchStatement(actor, id, data));
            return;
          }
          if (kind === "lines" && action === "exception") {
            send(200, store.saveException(actor, id, data));
            return;
          }
          if (kind === "links" && action === "unmatch") {
            send(200, store.unmatchStatement(actor, id, data));
            return;
          }
        }
      }
      const phase4 = path.match(
        /^\/api\/(statements|tax|taxrules|bankmovements|periods)(?:\/([\w-]+))?(?:\/(source|events|evidence|reopen)(?:\/([\w-]+))?)?$/,
      );
      if (phase4) {
        const [, kind, id, action, fileId] = phase4;
        if (req.method === "GET" && !action) {
          const result =
            kind === "statements"
              ? id
                ? store.statementImport(id)
                : store.statementImports()
              : kind === "tax"
                ? id
                  ? store.taxRecord(id)
                  : store.taxes()
                : kind === "taxrules"
                  ? store.taxRules()
                  : kind === "bankmovements"
                    ? store.otherMovements()
                    : store.periods();
          send(200, result);
          return;
        }
        if (
          req.method === "GET" &&
          id &&
          ((kind === "statements" && action === "source") ||
            (kind === "tax" && action === "evidence" && fileId))
        ) {
          const file =
            kind === "statements"
              ? store.statementSource(id)
              : store.taxEvidence(id, fileId);
          res.writeHead(200, {
            "Content-Type": file.type || "application/octet-stream",
            "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
            "Content-Security-Policy": "sandbox; default-src 'none'",
          });
          res.end(Buffer.from(file.data, "base64"));
          return;
        }
        if (req.method === "POST") {
          if (kind === "statements" && id === "preview" && !action) {
            send(200, store.previewStatement(data));
            return;
          }
          if (kind === "statements" && id === "import" && !action) {
            send(201, store.importStatement(actor, data));
            return;
          }
          if (!id) {
            const result =
              kind === "tax"
                ? store.saveTaxRecord(actor, data)
                : kind === "taxrules"
                  ? store.saveTaxRule(actor, data)
                  : kind === "bankmovements"
                    ? store.saveBankMovement(actor, data)
                    : kind === "periods"
                      ? store.lockPeriod(actor, data)
                      : null;
            if (result) {
              send(201, result);
              return;
            }
          }
          if (id && kind === "tax" && action === "events") {
            send(200, store.addTaxEvent(actor, id, data));
            return;
          }
          if (id && kind === "periods" && action === "reopen") {
            send(200, store.reopenPeriod(actor, id, data));
            return;
          }
        }
      }
      const finance = path.match(
        /^\/api\/(claims|payments)(?:\/([\w-]+))?(?:\/(approve|submit|post|return|cancel|fail|reverse|evidence)(?:\/([\w-]+))?)?$/,
      );
      if (finance) {
        const [, kind, id, action, fileId] = finance;
        if (req.method === "GET" && !action) {
          send(
            200,
            id
              ? kind === "claims"
                ? store.claim(id)
                : store.payment(id)
              : kind === "claims"
                ? store.claims()
                : store.payments(),
          );
          return;
        }
        if (req.method === "POST" && !id) {
          send(
            201,
            kind === "claims"
              ? store.saveClaim(actor, null, data)
              : store.savePayment(actor, null, data),
          );
          return;
        }
        if (req.method === "PUT" && id && !action) {
          send(
            200,
            kind === "claims"
              ? store.saveClaim(actor, id, data)
              : store.savePayment(actor, id, data),
          );
          return;
        }
        if (
          req.method === "GET" &&
          kind === "payments" &&
          action === "evidence" &&
          fileId
        ) {
          const file = store.paymentEvidenceFile(id, fileId);
          res.writeHead(200, {
            "Content-Type": file.type,
            "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
            "Content-Security-Policy": "sandbox; default-src 'none'",
          });
          res.end(Buffer.from(file.data, "base64"));
          return;
        }
        if (req.method === "POST" && id && action && !fileId) {
          if (kind === "claims")
            send(200, store.transitionClaim(actor, id, action, data));
          else if (action === "evidence")
            send(200, store.addPaymentEvidence(actor, id, data));
          else if (action === "reverse")
            send(200, store.reverseFinancial(actor, "payments", id, data));
          else send(200, store.transitionPayment(actor, id, action, data));
          return;
        }
      }
      const receipt = path.match(
        /^\/api\/receipts(?:\/([\w-]+))?(?:\/(post|reverse|evidence)(?:\/([\w-]+))?)?$/,
      );
      if (receipt) {
        const [, id, action, fileId] = receipt;
        if (req.method === "GET" && id && action === "evidence" && fileId) {
          const file = store.evidenceFile(id, fileId);
          res.writeHead(200, {
            "Content-Type": file.type,
            "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
            "Content-Security-Policy": "sandbox; default-src 'none'",
          });
          res.end(Buffer.from(file.data, "base64"));
          return;
        }
        if (req.method === "GET" && !action) {
          send(200, id ? store.receipt(id) : store.receipts());
          return;
        }
        if (req.method === "POST" && !id) {
          send(201, store.saveReceipt(actor, null, data));
          return;
        }
        if (req.method === "PUT" && id && !action) {
          send(200, store.saveReceipt(actor, id, data));
          return;
        }
        if (req.method === "POST" && id && !fileId && action) {
          send(
            200,
            action === "reverse"
              ? store.reverseFinancial(actor, "receipts", id, data)
              : action === "post"
                ? store.postReceipt(actor, id, data)
                : store.addEvidence(actor, id, data),
          );
          return;
        }
      }
      if (path === "/api/audit" && req.method === "GET") {
        send(200, store.auditList(actor, url.searchParams.get("entity")));
        return;
      }
      if (path === "/api/numbering" && req.method === "GET") {
        send(200, store.numbering(actor));
        return;
      }
      const master = path.match(/^\/api\/masters\/([a-z]+)(?:\/([\w-]+))?$/);
      if (master && kinds.includes(master[1])) {
        const [, kind, id] = master;
        if (req.method === "GET") {
          send(
            200,
            id
              ? store.detail(
                  actor,
                  kind,
                  id,
                  url.searchParams.get("restricted") === "true",
                )
              : store.list(actor, kind),
          );
          return;
        }
        if (req.method === "POST" && !id) {
          send(201, store.save(actor, kind, null, data));
          return;
        }
        if (req.method === "PUT" && id) {
          send(200, store.save(actor, kind, id, data));
          return;
        }
      }
      throw new AppError(404, "Endpoint not found.");
    } catch (error) {
      if (!(error instanceof AppError))
        console.error("Request failed:", error.message);
      if (!res.headersSent)
        send(error.status || 500, {
          error: error.status
            ? error.message
            : "Something went wrong. Try again or restart the local workspace.",
          fields: error.fields || {},
        });
      else res.end();
    }
  });
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const directory = process.env.FUNDTRACE_DATA_DIR || join(root, "data");
  const release = lockWorkspace(directory);
  let store;
  try {
    store = new Store(directory);
  } catch (error) {
    release();
    throw error;
  }
  const port = Number(process.env.PORT || 3000);
  const recovery = {};
  const automaticBackup = () => {
    try {
      const latest = listBackups(directory)[0];
      if (
        !latest ||
        Date.now() - Date.parse(latest.createdAt) >= 24 * 60 * 60 * 1000
      )
        createBackup(store);
      recovery.error = null;
    } catch (error) {
      recovery.error =
        "Automatic backup failed. Check free disk space and folder permissions, then create a backup here.";
      console.error("Backup failed:", error.message);
    }
  };
  automaticBackup();
  const timer = setInterval(automaticBackup, 60 * 60 * 1000);
  timer.unref();
  const server = createApp(store, recovery);
  server.on("error", (error) => {
    clearInterval(timer);
    store.close();
    release();
    console.error(`Could not start FundTrace: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, "127.0.0.1", () =>
    console.log(
      `FundTrace offline workspace: http://127.0.0.1:${server.address().port}`,
    ),
  );
  const stop = () =>
    server.close(() => {
      store.close();
      clearInterval(timer);
      release();
      process.exit(0);
    });
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}
