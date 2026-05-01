import { createServer, request as httpRequest } from "http";

const domain = process.env.REPLIT_DEV_DOMAIN;

if (!domain) {
  console.error("REPLIT_DEV_DOMAIN not set");
  process.exit(1);
}

const APP_PORT = 5000;
const targetUrl = `https://${domain}/`;

function startRedirect(port) {
  createServer((_req, res) => {
    res.writeHead(301, { Location: targetUrl });
    res.end();
  }).listen(port, "0.0.0.0", () => {
    console.log(`Redirect server on port ${port} → ${targetUrl}`);
  });
}

function startProxy(port) {
  createServer((req, res) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const body = Buffer.concat(chunks);

      // Build clean headers: copy originals but explicitly set content-length
      // and remove transfer-encoding so there's no HTTP/1.1 header conflict
      // when the Replit mTLS proxy converts HTTP/2 chunked streams to HTTP/1.x.
      const forwardHeaders = { ...req.headers };
      delete forwardHeaders["transfer-encoding"];
      delete forwardHeaders["content-encoding"];
      forwardHeaders["host"] = `localhost:${APP_PORT}`;
      if (body.length > 0) {
        forwardHeaders["content-length"] = String(body.length);
      }

      const opts = {
        hostname: "127.0.0.1",
        port: APP_PORT,
        path: req.url,
        method: req.method,
        headers: forwardHeaders,
      };

      const proxy = httpRequest(opts, (upstream) => {
        // Filter hop-by-hop headers before forwarding response
        const responseHeaders = { ...upstream.headers };
        delete responseHeaders["connection"];
        delete responseHeaders["transfer-encoding"];
        if (upstream.headers["content-length"]) {
          responseHeaders["content-length"] = upstream.headers["content-length"];
        }

        res.writeHead(upstream.statusCode, responseHeaders);
        upstream.pipe(res, { end: true });
      });

      proxy.on("error", (err) => {
        console.error(`[Proxy:${port}] Error forwarding ${req.method} ${req.url}:`, err.message);
        if (!res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "API server is unavailable. Please try again in a moment." }));
        }
      });

      if (body.length > 0) {
        proxy.write(body);
      }
      proxy.end();
    });

    req.on("error", (err) => {
      console.error(`[Proxy:${port}] Request read error:`, err.message);
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
  }).listen(port, "0.0.0.0", () => {
    console.log(`Proxy server on port ${port} → localhost:${APP_PORT}`);
  });
}

startProxy(18593);
startProxy(8080);
