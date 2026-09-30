---
name: vendre-store-troubleshooting
description: Symptom-to-cause table for Vendre Surface v2 storefronts - 401 loops in preview iframes, empty cart at checkout, cart jumping back, CORS errors that are really gateway 401s, 429 storms, VQL 500s, CMS pages treated as products, empty profile forms and blocked accounts calls. Use when a Vendre integration misbehaves at runtime.
---

# Vendre Surface v2 troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Menus/cart 401 in a loop, only inside the preview iframe | Session cookie rejected by the embedded browser context | Rewrite the proxy `Set-Cookie` to `Path=/; Secure; SameSite=None; Partitioned` (CHIPS). `SameSite=Lax` is dropped. |
| User randomly signed out after page load | A non-bootstrap response's `Set-Cookie` was written back, minting competing sessions | Only `session/bootstrap` may establish the cookie; others may only refresh an existing one. |
| Cart is empty on the store's checkout page | The session cookie only exists in the server proxy's cookie jar, not the visitor's browser | Call `session/bootstrap` and cart endpoints **directly from the browser** with `credentials:"include"`; allowlist the origin. Passing the session id as a query param does nothing. |
| Cart "jumps back" after a change | Optimistic state never reconciled, or an intermediate sync overwrote a later one | Debounce and coalesce, one inflight sync, last write wins, then replace local state with the server response (`vendre-cart-checkout`). |
| Wrong quantity ends up in the order | Checkout navigated before pending syncs flushed | Flush + `GET shopping-cart` verify before navigating. |
| Everything returns 429/502 at once | `oauth/token` quota burned by minting a token per request | Global token cache, 60s cooldown, min renew interval (`vendre-surface-v2`). |
| Generic browser CORS error with no detail | Gateway-level 401 from a bad bearer — may carry no CORS headers (session responses, incl. session-gate 401s, include them since 2026-09-30) | Check bearer and session first; usually not a real CORS misconfiguration. |
| Need to trace what the store received | Surface audit log (since 2026-09-30) | Admin → `/Admin/headless/audit/logs/browse` — exact-match filters, date range, max 200 per page, live rows only. |
| `/accounts/*` blocked while other calls work | `accounts*` resolves to the **`default`** CORS policy, not `customer` | Allowlist the origin under `default`. |
| `POST /contact` blocked | Contact uses the `email/contact` policy | Allowlist the origin under `email/contact`. |
| `POST vql` returns 500 for every body shape | Not enabled/working on that install | Fall back to `GET categories/{id}`; keep the data layer switchable. |
| CMS/information pages render as products | Menu items of type `information_page` point to galleries | Route them to the CMS page route (`vendre-cms-galleries`). |
| Broken images on CMS pages | Content-block image paths are relative | Resolve against the store base URL. |
| Profile form empty although login and save work | `accounts/me` returns flat, nested (`account`, `address`) or alias keys (`email`, `phone`, `zip`) | Normalise all shapes and merge the address book (`vendre-customer-account`). |
| `422 SURFACE_ACCOUNT_MALFORMED_BODY` on registration | Partial field set | Send the full documented body. |
| `accounts/me/forgot-password` returns 401 | It requires the mutation token despite being a GET | Attach `Surface-Mutation-Protection-Token` to that GET. |
| Filter counts and pagination disagree | Filtering done client-side on an already-paginated list | Send `tags[]`, `filter`/`f`, `pfrom`, `pto` to the API and render counts from the response. |
| Prices stay in the old currency after a switch | Price-bearing caches not invalidated after `POST session` | Invalidate categories, products and cart. |
| First form submit after a cold load fails | Submit ran before bootstrap finished, so no mutation token | Ready-gate the form (`vendre-surface-v2`). |

## Preview vs published origins

Preview and published domains are different origins. Allowlisting the published
domain does not allowlist previews — the direct-to-store path fails in preview
and falls back to the proxy. That fallback must be silent.

## Headers worth reading

`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After`, and
`concurrencylimit-remaining` on `oauth/token`. Error bodies follow
`{ "errors": [{ "code", "status", "public", "title", "source": { "parameter" } }] }`.

## Store-side checks

`IS_HEADLESS` and the Surface CORS policies live under
Admin → Headless → CORS (`/Admin/configuration?gID=232`). Origins are scheme +
host, no trailing slash. For which policy and token each endpoint needs, see the
endpoint catalogue in `.vendre/knowledge/api-reference.md` §2–§3 — it is the
source of truth.
