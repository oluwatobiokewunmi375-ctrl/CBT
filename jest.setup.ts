import "@testing-library/jest-dom";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

// Set test environment
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key-01234567890123456789";

globalThis.Request = globalThis.Request ?? (globalThis as any).Request;
globalThis.Response = globalThis.Response ?? (globalThis as any).Response;
globalThis.Headers = globalThis.Headers ?? (globalThis as any).Headers;

globalThis.__CBT_STATE__ = globalThis.__CBT_STATE__ ?? {
  users: new Map(),
  tokens: new Map(),
};

const originalFetch = globalThis.fetch;
const apiRoot = path.resolve(process.cwd(), "./app/api");

type RouteResult = {
  filePath: string;
  params: Record<string, string>;
};

function findApiRoute(pathname: string): RouteResult | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "api") {
    segments.shift();
  }

  function traverse(
    dir: string,
    index: number,
    params: Record<string, string>
  ): RouteResult | null {
    if (index === segments.length) {
      const routeBase = path.join(dir, "route");
      const tsPath = routeBase + ".ts";
      const jsPath = routeBase + ".js";
      if (fs.existsSync(tsPath)) {
        return { filePath: tsPath, params };
      }
      if (fs.existsSync(jsPath)) {
        return { filePath: jsPath, params };
      }
      return null;
    }

    if (!fs.existsSync(dir)) {
      return null;
    }

    const segment = segments[index];
    const entries = fs.readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory());

    const directMatch = entries.find((entry) => entry.name === segment);
    if (directMatch) {
      const result = traverse(path.join(dir, directMatch.name), index + 1, params);
      if (result) {
        return result;
      }
    }

    for (const entry of entries) {
      const match = entry.name.match(/^\[(.+)\]$/);
      if (!match) continue;
      const paramName = match[1];
      const result = traverse(
        path.join(dir, entry.name),
        index + 1,
        {
          ...params,
          [paramName]: segment,
        }
      );
      if (result) {
        return result;
      }
    }

    return null;
  }

  return traverse(apiRoot, 0, {});
}

globalThis.fetch = async (input: any, init: any = {}) => {
  const url = typeof input === "string" ? input : input?.url;
  if (!url) {
    return originalFetch ? originalFetch(input as any, init as any) : new Response(null, { status: 500 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url, "http://localhost");
  } catch {
    return originalFetch ? originalFetch(input as any, init as any) : new Response(null, { status: 500 });
  }

  if (!parsed.pathname.startsWith("/api")) {
    return originalFetch ? originalFetch(input as any, init as any) : new Response(null, { status: 500 });
  }

  try {
    const method = ((init.method || "GET") as string).toUpperCase();
    const route = findApiRoute(parsed.pathname);
    if (!route) {
      console.error("[JEST-FETCH] route not found for", parsed.pathname);
    } else {
      console.log("[JEST-FETCH] route found", route.filePath, route.params);
    }
    if (!route) {
      return new Response(JSON.stringify({ error: `Route module not found for ${parsed.pathname}` }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    let mod: any;
    try {
      mod = require(route.filePath);
    } catch {
      mod = await import(pathToFileURL(route.filePath).href);
    }

    const handler = mod[method] || mod.default;
    if (!handler) {
      return new Response(JSON.stringify({ error: `Handler ${method} not found for ${parsed.pathname}` }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const req = new Request(parsed.toString(), {
      method,
      headers: init.headers,
      body: init.body,
    });

    const result = await handler(req, { params: Promise.resolve(route.params) });

    if (result instanceof Response) {
      return result;
    }

    let status = 200;
    let body: any = null;
    const headers: Record<string, string> = {};

    if (result) {
      if (typeof result.status === "function") {
        status = result.status();
      } else if (typeof result.status === "number") {
        status = result.status;
      }

      body = result._bodyInit ?? result.body ?? null;

      if (result.headers && typeof result.headers.get === "function") {
        result.headers.forEach((value: string, key: string) => {
          headers[key] = value;
        });
      }
    }

    const bodyText = typeof body === "string" ? body : JSON.stringify(body ?? {});
    return new Response(bodyText, {
      status,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });
  } catch (error: any) {
    console.error("[JEST-FETCH] API route error", error);
    return new Response(JSON.stringify({ error: error?.message ?? "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export {};
