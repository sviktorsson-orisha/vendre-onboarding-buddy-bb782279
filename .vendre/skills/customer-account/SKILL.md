---
name: vendre-customer-account
description: Vendre Surface v2 customer authentication and account area - login (email, Google/Microsoft SSO, BankID, magic link), logout, registration, profile normalisation, address book, order history and password reset, with copyable provider/proxy templates. Use when building sign-in, "create account", "my pages", profile forms, or when users get signed out, hit SURFACE_ACCOUNT_MALFORMED_BODY 422s or empty profile forms.
---

# Customer auth and account area (Surface v2)

Scope: everything customer-identity related. The visitor session itself lives in
`vendre-session-context`; transport, tokens and CORS in `vendre-surface-v2`.

Copy the templates in `assets/`, then follow the rules below — each exists
because it was a real bug that took hours to find.

## Architecture

```text
browser  ──> createServerFn (vendre.functions.ts)  ──> proxy (vendre.server.ts) ──> store
   |            reads/writes first-party cookie          OAuth token cache
   |            "vendre_sid" (HttpOnly)                  client_secret (server env only)
   |
   └─ VendreProvider (session, mutation token, ready-gate)
        └─ AccountProvider (auth state, login/register/logout, account queries)
```

Env: `VENDRE_BASE_URL`, `VENDRE_CLIENT_ID`, `VENDRE_CLIENT_SECRET` (server-only).

## Login and logout

- **Login:** `POST /surface/2/login/email` with `{ "email": "...", "password": "..." }`.
  The field is `email`, **not** `email_address`. Mutation token required.
- **Logout:** `POST /surface/2/logout`, mutation token required.
- **Auth state comes from `GET /surface/2/session/context`**, never from the
  login response alone. After login and logout: `refreshSession()`, replace the
  stored `surface_mutation_protection_token`, invalidate all customer-scoped
  queries.
- **SSO and passwordless** (when enabled in Admin):
  `GET /surface/2/login/google-sso`, `GET /surface/2/login/microsoft-sso`,
  BankID (`GET bankid/qr-token`, `GET bankid/status`, `POST bankid/login`), and
  the magic link `POST /surface/2/login-link` — the magic link has **no CORS
  support** and must go through the server proxy. SSO redirects need the
  frontend origin allowlisted under the `login` policy.
- **Session must survive a hard reload:** mirror the store session into a
  first-party `HttpOnly; Secure; SameSite=None; Partitioned` cookie.
- **Ready-gate the sign-in form** — a submit before bootstrap resolves runs
  without a mutation token and fails silently.

## Reading the profile correctly

`GET /surface/2/accounts/me` does not have one fixed shape. Depending on the
store it returns fields:

- **flat** (`firstname`, `postcode`, …)
- **nested** under `account`, `customer`, `address` or `data`
- **with alias keys**: `email` / `email_address`, `phone` / `telephone` /
  `mobile`, `zip` / `postcode`, `street` / `street_address`

Normalise all three forms into one typed object, then merge in the address book
(`GET /surface/2/accounts/me/addresses`) before populating the form. Symptom of
getting this wrong: login works and saving works, but the form renders empty.

Writing back: `PUT /surface/2/accounts/me` and
`PUT /surface/2/accounts/me/addresses`, using the store's canonical key names
(the ones it returned), with the mutation token.

## Registration

`POST /surface/2/accounts` with the full documented field set —
`first_name`, `last_name`, `email_address`, `password`, `confirmation`, `type`,
`gender`, `company`, `street_address`, `postcode`, `city`, `country`,
`telephone`, `mobile`, `personnummer`, `vat_identification_number`,
`newsletter`, `consent_personal_data_policy`. A partial body returns
`422 SURFACE_ACCOUNT_MALFORMED_BODY`. Map each error's `source.parameter` to the
matching field.

## Orders and password reset

- `GET /surface/2/accounts/me/order-history` and `/order-history/{id}`.
- `GET /surface/2/accounts/me/forgot-password` — requires the mutation token
  even though it is a GET.
- `GET /surface/2/accounts/me` is the logged-in check (`customers/current` was removed).

## Non-negotiables

- **Never cache** account data or order history — fetch fresh on every view.
- All `accounts*` endpoints resolve to the **`default`** CORS policy, not
  `customer`. Allowlist the frontend origin there, and fall back to the server
  proxy silently — never show a CORS error to the user.
- Import providers through the `@/lib/...` alias everywhere; mixing relative and
  alias imports duplicates the module and throws
  "useAccount must be used inside <AccountProvider>".

## Build order

1. Copy `assets/vendre.server.ts` and `assets/vendre.functions.ts`; add env vars.
2. Copy `assets/vendre-session.tsx`; mount `<VendreProvider>` in `__root.tsx`.
3. Copy `assets/vendre-account.tsx`; mount `<AccountProvider>` **inside** it.
4. Build `/login` (sign-in + register) per `references/login-register.md`.
5. Build the account area per `references/account-pages.md`.

## References

- `references/session-lifecycle.md` — bootstrap, cookies, race conditions
- `references/login-register.md` — exact payloads and error handling
- `references/account-pages.md` — tabbed account area structure
- `references/troubleshooting.md` — symptom → cause table
