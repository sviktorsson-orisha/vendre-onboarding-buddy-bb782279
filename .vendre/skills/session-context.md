---
name: vendre-session-context
description: Vendre Surface v2 session lifecycle and store context - bootstrap once, ready-gate every call, read store name/logo/currency/language/VAT from session context, switch market or currency, end the session, and cookie rules for preview iframes. Use when wiring app startup, store branding, price/VAT display, language or currency switchers, or when visitors get randomly signed out.
---

# Session and store context (Surface v2)

Scope: the visitor session and the store's own settings. Customer login and
account data live in `vendre-customer-account`; transport and tokens in
`vendre-surface-v2`.

## Lifecycle

| Call | Purpose | CORS policy |
| --- | --- | --- |
| `POST session/bootstrap` | establish session, get mutation token | `bootstrap` |
| `GET session` | compact status (authenticated, cart item count) | `session` |
| `GET session/context` | extended context and store config | `session` |
| `POST session` | change market / currency / language / VAT | `session` |
| `POST session/end` | clear customer identity, keep visitor session | `session` |

1. **`POST session/bootstrap` exactly once at app start.** It sets the store
   session cookie and returns `surface_mutation_protection_token` (~1h).
   **Only this call may establish the session cookie** — if any other response's
   `Set-Cookie` is written back, concurrent first-paint requests each mint their
   own visitor session and the user appears randomly signed out. Other calls may
   only *refresh* a cookie that already existed on the request.
2. **Gate every other call on a shared `ready` promise.** Without it the first
   paint races bootstrap and those requests run session-less and 401.
3. **`POST session`** requires at least one field and the mutation token;
   `language` accepts `{"id": 1}` or `{"code": "sv"}`. Invalidate every
   price-bearing cache afterwards (categories, products, cart).
4. **`POST session/end`** requires the mutation token.

Bootstrap response (200):

```json
{
  "session_id": "...",
  "is_new": true,
  "customer_group_id": 1,
  "authenticated": false,
  "customer": null,
  "cart_item_count": 0,
  "customer_type": null,
  "currency": { "code": "SEK" },
  "language": { "id": 1, "code": "sv" },
  "market": { "id": 1 },
  "prices_include_vat": true,
  "surface_mutation_protection_token": "<token>",
  "surface_mutation_protection_token_expires_at": 1234567890,
  "surface_mutation_protection_token_expires_in": 3600
}
```

## Store details come from the session — never hardcode

`GET session/context` exposes the store's own configuration:

- `STORE_NAME` and `SHOP_LOGO` → header, footer, page titles
- `currency.code`, `language.code`, `market.id` → formatting and switchers
- `prices_include_vat` → whether displayed prices include VAT
- `customer` (`first_name`, `last_name`, …) when authenticated
- `countries` (`[{ id, code, name }]`) → the `country_id` select in the
  register and edit-account forms. Never hardcode country ids; Sweden is `752`
  (ISO 3166-1 numeric) in this store.


Never hardcode a brand name, logo asset, currency or VAT assumption. If the
storefront shows it, it should come from session context.

**Verified 2026-09-21:** `configuration` currently contains only `STORE_NAME`
and `SHOP_LOGO`. No admin toggle is exposed there — in particular the
"allow customers to enter company / organisation number" settings are not
readable, and no confirmed endpoint reports them. Do not guess a path, do not
add a manual switch; wait until the store exposes them.

## Cookie rules

The store sets its session cookie as `Secure; SameSite=None`. When the
same-origin proxy fallback re-scopes it to the app origin, rewrite it to:

```text
Path=/; Secure; SameSite=None; Partitioned
```

`Partitioned` (CHIPS) is mandatory — inside an embedded preview iframe the
cookie is otherwise dropped and every session-scoped call 401-loops.
`SameSite=Lax` is dropped too. Keep a `localStorage` mirror only as a fallback
for environments without cookies.

## 401 handling

`SURFACE_SESSION_UNAUTHORIZED` means the session died — re-bootstrap once
(de-duplicated promise), replace the mutation token, retry the original request.
It must **not** trigger an OAuth bearer renew. Throttle re-bootstraps so a
permanently stale session cannot loop.

## Never cache

`GET session` and `GET session/context` are live per visitor —
`staleTime: 0`, `gcTime: 0`.
