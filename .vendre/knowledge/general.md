### General Context

- This workspace is strictly dedicated to building e-commerce frontends connecting to Vendre stores via Surface API v2 (/surface/2/\*). The platform also exposes v1, but storefronts built here call v2 only.
- `.vendre/knowledge/api-reference.md` is the source of truth for endpoints, CORS policies, headers and error formats. Where this file or a skill disagrees with it, the reference wins.

### Architecture & Security Rules

- NEVER expose `client_secret`, OAuth token generation or the OAuth access token in frontend client code.
- **All Surface v2 traffic is proxied.** The browser only calls same-origin `/api/vendre/*`; the server route `src/routes/api/vendre/surface/$.ts` forwards to `${VENDRE_BASE_URL}/surface/2/*` and adds the bearer token server-side. There is no endpoint that hands the access token to the browser.
- The proxy forwards the incoming `cookie` header upstream and rewrites the store's `Set-Cookie` to our own origin (`Domain` stripped, `Path=/`, `SameSite=Lax`, `Secure` on https) so session, login and cart work.
- The store base URL is only exposed through `/api/vendre/status` for store-hosted links (checkout, images), never for API calls.
- `POST /surface/2/login-link` lacks CORS support in Vendre and is covered by the same proxy.

### CORS & Admin Configuration Rules

- Storefront data no longer depends on CORS, because no browser request reaches the store origin. Keep the allowlist for the checkout hand-off.
- **CORS Policies Allowlisting (when a direct browser call is used):** the origin (scheme + host, no trailing slash) must be allowlisted under `Admin → Headless → CORS` (`/Admin/configuration?gID=232`, fields `SURFACE_CORS_ORIGINS` / `SURFACE_CORS_POLICIES`).
- **CORS Gotchas:**
  - All `/surface/2/accounts*` endpoints resolve to the `default` CORS policy (NOT `customer`).
  - `POST /surface/2/contact` requires policy `email/contact` (note the slash).
  - Gateway-level 401s (invalid Bearer or Session gate) do not carry CORS headers and appear as generic browser CORS errors.


### Vendre Surface v2 Core Integration Rules

- Base API Path: `/surface/2/`.
- OAuth requests (`/oauth/token`, `/oauth/revoke`) MUST use `Content-Type: application/x-www-form-urlencoded`.
- App Startup: Always initiate session via `POST /surface/2/session/bootstrap` via the backend proxy.
- State Management: Store `surface_mutation_protection_token` in app state (avoid `localStorage`).
- Mutating Calls (POST, PUT, DELETE): MUST include header `Surface-Mutation-Protection-Token: <token>`.
- Token Refresh on Login/Logout: Always update the stored mutation token with `mutation_protection_token` returned after login, logout or `GET shopping-cart` (legacy: `mutationProtectionToken`).

### Caching & Dynamic State Strategy

- CACHE STATIC & READ-HEAVY DATA: Cache navigation menus (`GET navigation/menus`), category trees (`GET categories/{id}`), CMS/galleries (`GET galleries/*`), and product/VQL queries client-side.
- DO NOT CACHE DYNAMIC USER DATA: Always fetch fresh live data for shopping cart (`GET shopping-cart*`), session context (`GET session*`), and customer profile (`GET accounts/me*`).
- LIVE SHOPPING CART: Any cart mutation (`POST/DELETE shopping-cart/*` or coupons) MUST immediately invalidate cached cart state and force an instant UI re-fetch.

### Available Workspace Skills Index

Recall and apply these dedicated skills based on the active task:

- `vendre-surface-v2`: Core API architecture, proxy setup, OAuth token lifecycle.
- `vendre-session-context`: Session bootstrap, context reading, market/currency/language switching, session end.
- `vendre-pdp-products`: Product detail pages (PDP), VQL querying, variants, dynamic pricing, VAT flags.
- `vendre-category-plp`: Category pages (PLP), query params, pagination, filters, sorting, subcategories.
- `vendre-cart-checkout`: Live cart drawer, quantity updates, discount coupons, upsell endpoints.
- `vendre-customer-account`: Account profile, order history, addresses, registration, BankID (uses `default` policy).
- `vendre-navigation-menus`: Header/footer navigation, mega menus, dynamic breadcrumbs.
- `vendre-cms-galleries`: CMS pages, content blocks, galleries, Twig block rendering.
- `vendre-vql-queries`: VQL search, resource mapping, multi-resource queries.
- `vendre-ecommerce-seo`: Meta tags, Schema.org (JSON-LD), sitemap types.
- `vendre-contact-forms`: Contact forms, antispam/captcha, `email/contact` policy.
- `vendre-sso-login`: Google/Microsoft SSO redirects and proxied magic login links.
- `vendre-admin-troubleshooting`: CORS issues, 401/429 errors, rate limits, IS_HEADLESS mode.

### Rate Limiting & Error Conventions

- Respect HTTP 429 rate limits: inspect `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, and `Retry-After` headers.
- Standard API errors follow `{ "errors": [{ "id", "status", "code", "title", "detail", "public", "source": { "pointer", "parameter", "header" } }] }`, where `status`, `code` and `title` are always present and the rest are optional (see api-reference.md §1.7).
- Handle HTTP 401 by triggering a session re-bootstrap when the code is `SURFACE_SESSION_UNAUTHORIZED`; a bare 401 without a Surface code means the bearer must be renewed.
