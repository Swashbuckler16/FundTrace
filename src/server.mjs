import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Store, LOCAL_ACTOR } from "./store.mjs";
import { AppError, demand, kinds } from "./domain.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assets = {
  "/": ["index.html", "text/html"],
  "/app.js": ["app.js", "text/javascript"],
  "/styles.css": ["styles.css", "text/css"],
  "/tokens.css": ["tokens.css", "text/css"],
  "/base.css": ["base.css", "text/css"],
};

export async function readRequestBody(stream) {
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    demand(size <= 65536, "Request is too large.", 413);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function createApp(store) {
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
        const body = await readRequestBody(req);
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
  const store = new Store(process.env.FUNDTRACE_DATA_DIR || join(root, "data"));
  const port = Number(process.env.PORT || 3000);
  const server = createApp(store);
  server.listen(port, "127.0.0.1", () =>
    console.log(`FundTrace offline workspace: http://127.0.0.1:${port}`),
  );
  const stop = () =>
    server.close(() => {
      store.close();
      process.exit(0);
    });
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}
