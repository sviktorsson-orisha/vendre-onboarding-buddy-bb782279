---
name: vendre-architecture-bootstrap
description: Request topology for a headless Vendre Surface API v2 storefront - server-side OAuth only, direct browser-to-store calls with credentials include, same-origin proxy fallback, and checkout hand-off by real navigation. Use when starting a new Vendre frontend or when the store session or cart does not follow the visitor into checkout.
---

# Vendre Surface v2 storefront architecture

We work **exclusively against Surface API version 2** — every path is
`/surface/2/<endpoint>`. Never v1 (it rejects cross-origin requests with 403 `cors_not_supported`), never other Vendre APIs.

This is the single most expensive thing to get wrong. Build it this way from
day one.

```text
browser ──/api/vendre/surface/<path>──> our server route
   │                                       ├─ adds Bearer server-side (cached ~1h)
   │                                       ├─ forwards cookie, rewrites Set-Cookie to our origin
   │                                       └─ https://<store>/surface/2/<path>
   └──/api/vendre/status──> connected? + store base URL (links/images only)
```

## Rules

1. **Nothing calls the store from the browser.** Every Surface call goes to the
   same-origin catch-all `src/routes/api/vendre/surface/$.ts`, which attaches the
   OAuth bearer token server-side. `client_secret` and the access token never
   leave the server; there is no token endpoint for the client.
2. **The browser client uses `credentials: "same-origin"`.** The proxy forwards
   the incoming `cookie` header upstream and rewrites the store's `Set-Cookie`
   (`Domain` stripped, `Path=/`, `SameSite=Lax`, `Secure` on https) so the store
   session lives on our own origin.
3. **CORS is not needed for storefront data** — keep the allowlist only for the
   checkout hand-off.
4. **Checkout is a real browser navigation** (`window.location.href`, `<a>`, or
   a form submit) to the store's own checkout page — never `fetch`/XHR. The
   session cookie is first-party to us, so the store may start a fresh session
   there; handle the hand-off explicitly.
5. **Env vars:** `VENDRE_BASE_URL`, `VENDRE_CLIENT_ID`, `VENDRE_CLIENT_SECRET`
   (secret, server-only). Read them inside handlers, not at module scope.
6. **Mutation token** lives in a module-level variable (not `localStorage`) so a
   re-bootstrap always beats stale React state — see `vendre-mutation-tokens`.
7. **Array query params use brackets**: `tags[]=64&tags[]=81`.
8. **Errors**: parse `{ errors: [{ code, status, title }] }` into a typed error;
   401 is a state, not a crash.

## Build order

1. Server token helper + `/api/vendre/status` + the catch-all proxy
   `/api/vendre/surface/$` with cookie rewrite.
2. Browser client: proxy request helper, mutation token, retry and backoff,
   one-shot re-bootstrap on session 401.

3. Session provider that bootstraps once and gates every other call on a shared
   `ready` promise.
4. Feature routes: home, category (PLP), product (PDP), cart, account, CMS.

## CORS allowlist (Admin → Headless → CORS, `/Admin/configuration?gID=232`)

Add every frontend origin (scheme + host, no trailing slash: dev, preview and
production) to the policies: `oauth`, `bootstrap`, `session`, `customer`,
`shopping_cart`, `default` (this is where `accounts*` resolves!), `categories`,
`navigation_menus`, `sitemap`, `vendre_query_language`, `galleries`,
`email/contact`.

Related: `vendre-oauth-quota`, `vendre-session-store-context`,
`vendre-mutation-tokens`, `vendre-store-troubleshooting`.
