import "whatwg-fetch";
import "@testing-library/jest-dom";
import fs from "fs";
import path from "path";

globalThis.__CBT_STATE__ = globalThis.__CBT_STATE__ ?? {
  users: new Map(),
  tokens: new Map()
};

const originalFetch = globalThis.fetch;

globalThis.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input.url;
  try {
    const parsed = new URL(url, "http://localhost");
    const pathname = parsed.pathname;
    if (!pathname.startsWith("/api")) {
      return originalFetch(input as any, init as any);
    }

    const method = (init.method || "GET").toUpperCase();

    const appRoot = path.resolve(process.cwd(), "./app");
    const tryPaths = [];

    // direct map: /api/foo/bar -> <appRoot>/api/foo/bar/route
    tryPaths.push(path.join(appRoot, pathname, "route"));

    // dynamic segment replacement for last segment
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const replaced = parts.slice();
      replaced[replaced.length - 1] = "[id]";
      tryPaths.push(path.join(appRoot, "/" + replaced.join("/"), "route"));
    }

    // attempt to import any candidate by checking file existence and using file URL
    let mod = null;
    for (const p of tryPaths) {
      const tsPath = p + ".ts";
      const jsPath = p + ".js";
      if (fs.existsSync(tsPath)) {
        mod = await import('file://' + tsPath);
        break;
      }
      if (fs.existsSync(jsPath)) {
        mod = await import('file://' + jsPath);
        break;
      }
    }

    if (!mod) {
      throw new Error(`Route module not found for ${pathname}`);
    }

    const req = new Request("http://localhost" + pathname + parsed.search, {
      method,
      headers: init.headers,
      body: init.body,
    });

    const handler = mod[method];
    if (!handler) throw new Error(`Handler ${method} not found for ${pathname}`);

    const result = await handler(req);

    // Normalize NextResponse-like objects to standard Response
    let status = 200;
    let body = null;
    let headers = {};

    if (result) {
      if (typeof result.status === "function") {
        status = result.status();
      } else if (typeof result.status === "number") {
        status = result.status;
      }
      // NextResponse.json stores body in result._bodyInit or result.body
      body = result._bodyInit ?? result.body ?? null;
      if (result.headers && typeof result.headers.get === "function") {
        // convert Headers to plain object
        headers = {};
        result.headers.forEach((v, k) => (headers[k] = v));
      }
    }

    const bodyText = typeof body === "string" ? body : JSON.stringify(body ?? {});
    return new Response(bodyText, { status, headers: { "Content-Type": "application/json", ...headers } });
  } catch (err) {
    return originalFetch(input as any, init as any);
  }
};

export {};
