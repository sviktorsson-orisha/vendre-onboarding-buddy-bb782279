import { createFileRoute } from "@tanstack/react-router";

/**
 * Same-origin proxy for every Surface v2 call.
 *
 * The browser never sees the store URL, the OAuth access token or the
 * client credentials: it only talks to /api/vendre/surface/<path>. The store
 * session cookie is rewritten to this origin so login and cart keep working.
 */

const FORWARD_REQUEST_HEADERS = [
  "content-type",
  "accept",
  "accept-language",
  "surface-mutation-protection-token",
  // session/handover identifies the calling storefront from these.
  "origin",
  "referer",
];


const FORWARD_RESPONSE_HEADERS = [
  "content-type",
  "ratelimit-limit",
  "ratelimit-remaining",
  "ratelimit-reset",
  "retry-after",
];

function rewriteSetCookie(raw: string, secure: boolean): string {
  const parts = raw.split(";").map((p) => p.trim());
  const [pair, ...attrs] = parts;
  const kept: string[] = [];

  for (const attr of attrs) {
    const name = attr.split("=")[0]?.toLowerCase();
    // Drop the store's Domain and its SameSite/Secure choices — this cookie
    // now belongs to our own origin.
    if (name === "domain" || name === "samesite" || name === "secure" || name === "path") continue;
    kept.push(attr);
  }

  kept.push("Path=/");
  if (secure) {
    // The preview runs inside an iframe: a Lax cookie is dropped there, so the
    // session would be lost on every request. CHIPS keeps it partitioned.
    kept.push("SameSite=None");
    kept.push("Partitioned");
    kept.push("Secure");
  } else {
    kept.push("SameSite=Lax");
  }


  return [pair, ...kept].join("; ");
}

async function proxy({ request, params }: { request: Request; params: { _splat?: string } }) {
  const { isBrowserSameOrigin, rateLimit, tooManyRequests, forbidden } = await import(
    "@/lib/vendre/request-guard.server"
  );

  if (!isBrowserSameOrigin(request)) return forbidden();
  if (!rateLimit(request, "surface", 600, 60_000)) return tooManyRequests();

  const { readVendreEnv, getVendreServerToken, TokenError } = await import(
    "@/lib/vendre/token.server"
  );

  const { missing, baseUrl } = readVendreEnv();
  if (missing.length) {
    return Response.json(
      { errors: [{ code: "missing_credentials", title: "The store is not configured." }], missing },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  let accessToken: string;
  try {
    accessToken = (await getVendreServerToken()).accessToken;
  } catch (error) {
    const status = error instanceof TokenError ? error.status : 502;
    const headers: Record<string, string> = { "cache-control": "no-store" };
    if (error instanceof TokenError && error.retryAfter) headers["retry-after"] = error.retryAfter;
    return Response.json(
      { errors: [{ code: "token_failed", title: "Could not authenticate with the store." }] },
      { status, headers },
    );
  }

  const incoming = new URL(request.url);
  const path = (params._splat ?? "").replace(/^\/+/, "");
  const target = `${baseUrl}/surface/2/${path}${incoming.search}`;

  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (!headers.has("accept")) headers.set("accept", "application/json");

  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? null : await request.arrayBuffer();

  let upstream: Response;
  try {
    upstream = await fetch(target, { method, headers, body, redirect: "manual" });

  } catch {
    return Response.json(
      { errors: [{ code: "upstream_unreachable", title: "The store is not responding right now." }] },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }

  const outHeaders = new Headers();
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) outHeaders.set(name, value);
  }
  outHeaders.set("cache-control", "no-store");

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const secure = forwardedProto ? forwardedProto === "https" : incoming.protocol === "https:";

  const setCookies =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : ((upstream.headers.get("set-cookie") ? [upstream.headers.get("set-cookie")!] : []) as string[]);
  for (const raw of setCookies) outHeaders.append("set-cookie", rewriteSetCookie(raw, secure));

  return new Response(upstream.body, { status: upstream.status, headers: outHeaders });
}

export const Route = createFileRoute("/api/vendre/surface/$")({
  server: {
    handlers: {
      GET: proxy,
      POST: proxy,
      PUT: proxy,
      PATCH: proxy,
      DELETE: proxy,
    },
  },
});
