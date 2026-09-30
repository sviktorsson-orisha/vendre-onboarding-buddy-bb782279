# VENDRE LOVABLE TEMPLATE AGENT INSTRUCTIONS

You are an expert developer specializing in Vendre e-commerce.

## 0. MANDATORY ONBOARDING & DEMO MODE INITIALIZATION

If this project was just imported, created from this template, or if the Vendre API secrets (`VENDRE_BASE_URL`, `VENDRE_CLIENT_ID`, `VENDRE_CLIENT_SECRET`) are missing:

1. **Ask for credentials IMMEDIATELY:** Your very first action in the very first reply — before any greeting, analysis, suggestion, question or code — is to open the secrets form and ask for the store URL, client id and client secret. Never answer with proposals, alternatives or "what would you like to build first?" instead. Ask for all three values — `VENDRE_BASE_URL`, `VENDRE_CLIENT_ID` and `VENDRE_CLIENT_SECRET` — in ONE single secrets form, in one call. Accept a pasted trailing slash on the base URL but strip it before saving.
2. **Serve Storefront in Demo Mode:** Render the storefront template using local mock data from `src/mock/vendreResponses.ts` (`isConfigured: false`). The storefront is NEVER empty — it always shows either dummy data or live data.
3. **Launch Top Banner & Setup Modal:** Render the Top Setup Banner on all pages and open the onboarding modal automatically on page load until the store is connected or the user closes it.
4. **Execute Setup Procedure:** Read `/.vendre/skills/setup.md` and execute its procedure inside the onboarding wizard to guide the user through entering their API keys, verifying CORS and testing the connection. Steps 5 and 6 of the guide may only be marked green once CORS is confirmed AND the connection test passes.
5. **Transition to Live Mode:** Only switch `isConfigured` to `true` once the WHOLE guide is verified: credentials saved, CORS confirmed and the browser connection test green. A valid OAuth token is only the credentials check and must never set `connection_ok`. The successful browser test must persist `connection_ok` before invalidating the root loader, and both the guide and storefront must resolve status through the same server progress resolver. Until then keep serving dummy data.
6. **Guide storage:** the guide's progress lives in the Cloud table `public.vendre_setup_progress`. In a freshly imported project this table may be missing; the server then falls back to memory and the guide shows a warning. Apply the idempotent migration in `supabase/migrations/` that creates the table so progress persists across reloads and domains.



This behavior ensures the user can immediately browse the storefront UI with Vendre-structured dummy data while completed onboarding remains the top priority.

---

## 1. KNOWLEDGE DIRECTORY (`/.vendre/knowledge/`)

Before performing any architectural decisions or API calls, consult the corresponding knowledge file:

- **`general.md`**: Core architecture rules, directory layout, and overall design patterns.
- **`api-reference.md`**: Technical reference for all available Vendre API endpoints, payloads, headers, and response schemas.

**Source of truth:** `api-reference.md` is authoritative for endpoints, HTTP methods, CORS policies, required headers, mutation-token rules, and the error format. `general.md` and the skills describe usage patterns and UX — if any of them contradicts the reference, follow the reference and correct the other file.

**Non-negotiable request architecture:** the browser only calls same-origin `/api/vendre/*`. All Surface v2 traffic goes through the proxy route `src/routes/api/vendre/surface/$.ts`, which adds the OAuth bearer token server-side and rewrites the store session cookie to our origin. Never call `${VENDRE_BASE_URL}/surface/2/*` from client code, never expose `client_secret`, the access token, or a third-party API URL to the browser, and never reintroduce a `/api/vendre/token` endpoint.

---


## 2. SKILLS ROUTING TABLE (`/.vendre/skills/`)

### MANDATORY SKILL EXECUTION PROTOCOL

Before writing, refactoring, or generating ANY code for a requested feature:

1. **Search & Check:** You MUST check the table below and open the matching file in `/.vendre/skills/`.
2. **Strict Adherence:** If a relevant skill exists, you MUST follow its rules, component patterns, and API logic over your general knowledge.
3. **No Assumptions:** Never guess Vendre API schemas, endpoints, or state management logic — always derive them from the matching skill and `/.vendre/knowledge/api-reference.md`.

Always read the matching skill file **before** starting work in that area.

| Task / area                                            | File                                       |
| :----------------------------------------------------- | :----------------------------------------- |
| First-time setup, API keys, CORS, store status         | `.vendre/skills/setup.md`                  |
| Surface v2 core: proxy, OAuth, request architecture    | `.vendre/skills/surface-v2.md`             |
| App bootstrap & project architecture                   | `.vendre/skills/architecture-bootstrap.md` |
| Auth & sessions (full flow, code assets)               | `.vendre/skills/auth-sessions/SKILL.md`    |
| Login, register, account auth endpoints                | `.vendre/skills/account-auth.md`           |
| Customer account pages, orders, addresses              | `.vendre/skills/customer-account/SKILL.md` |
| Google/Microsoft SSO and magic login links             | `.vendre/skills/sso-login.md`              |
| Session bootstrap & context reads                      | `.vendre/skills/session-context.md`        |
| Market, currency, language & store context switching   | `.vendre/skills/session-store-context.md`  |
| Mutation protection tokens                             | `.vendre/skills/mutation-tokens.md`        |
| OAuth token lifecycle, quotas & rate limits            | `.vendre/skills/oauth-quota.md`            |
| Cart & checkout endpoints, coupons, upsell             | `.vendre/skills/cart-checkout.md`          |
| Cart UX: optimistic state, sync, flush before checkout | `.vendre/skills/cart-sync.md`              |
| Category pages (PLP), filters, sorting, pagination     | `.vendre/skills/category-plp.md`           |
| Product pages (PDP), variants, pricing, VAT            | `.vendre/skills/pdp-products.md`           |
| Logged prices / price history (`products/price-log-prices`) | `.vendre/skills/price-log.md`          |
| VQL search & multi-resource queries                    | `.vendre/skills/vql-queries.md`            |
| Header/footer navigation, mega menus, breadcrumbs      | `.vendre/skills/navigation-menus.md`       |
| CMS pages & content blocks                             | `.vendre/skills/cms-pages.md`              |
| Galleries & Twig block rendering                       | `.vendre/skills/cms-galleries.md`          |
| Contact forms, antispam, `email/contact` policy        | `.vendre/skills/contact-forms.md`          |
| SEO: meta tags, JSON-LD, sitemaps                      | `.vendre/skills/ecommerce-seo.md`          |
| Caching strategy for static vs dynamic data            | `.vendre/skills/caching.md`                |
| Troubleshooting: CORS, 401/429, IS_HEADLESS            | `.vendre/skills/store-troubleshooting.md`  |

Skills stored as folders (`auth-sessions/`, `customer-account/`) also contain `assets/` with reference implementations and `references/` with deep-dive docs — read those when the `SKILL.md` points at them.

---

## 3. FIRST INTERACTION PRIORITY

On the user's first chat interaction or initial workspace prompt:

1. Ensure the Top Setup Notice Bar is visible in the application UI.
2. Prompt the user to start the onboarding wizard via the top banner button or assist them directly using `/.vendre/skills/setup.md`.
- Front-page sections below the fold use LazySection + query `enabled`; store data is fetched client-side only because the Vendre session lives in the browser.
