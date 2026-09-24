---
name: vendre-account-auth
description: Vendre Surface v2 customer auth and account data - login/logout, deriving auth state from session context, normalising the many shapes of accounts/me, address book, registration, order history and password reset. Use when building sign-in, profile forms or account pages against Vendre.
---

# Customer auth and account data (Surface v2)

## Login and logout

- **Login:** `POST /surface/2/login/email` with `{ "email": "...", "password": "..." }`.
  The field is `email`, **not** `email_address`. Mutation token required.
- **Logout:** `POST /surface/2/logout`, mutation token required.
- **Auth state is read from `GET /surface/2/session/context`**, never from the
  login response alone. After both login and logout: refresh the session, replace
  the stored mutation token, and invalidate all customer-scoped queries.
- Alternative logins if the store enables them: `login/google-sso`,
  `login/microsoft-sso`, BankID (`bankid/qr-token`, `bankid/status`,
  `bankid/login`), and the magic link `login-link` (no CORS support — must go
  through the server proxy).

## Reading the profile correctly

`GET /surface/2/accounts/me` does not have one fixed shape. Depending on the
store it returns fields:

- **flat** (`firstname`, `postcode`, …)
- **nested** under `account`, `customer`, `address` or `data`
- **with alias keys**: `email` / `email_address`, `phone` / `telephone` /
  `mobile`, `zip` / `postcode`, `street` / `street_address`

A profile reader must normalise all three forms into one typed object, then
merge in the address book (`GET /surface/2/accounts/me/addresses`) for the
address fields before populating the form. Symptom of getting this wrong: login
works and saving works, but the form renders empty.

Writing back: `PUT /surface/2/accounts/me` and
`PUT /surface/2/accounts/me/addresses`, sending the store's canonical key names
(the ones it returned), with the mutation token.

## Registration

`POST /surface/2/accounts` with the field set the store asks for —
`firstname`, `lastname`, `email_address`, `password`, `confirmation`,
`street_address`, `postcode`, `city`, `country_id` (numeric — the only country
key, used as the form field name too; no country-list endpoint exists yet, so
the form ships a fixed list), plus the optional
fields the store enables (`company`, `personnummer`, `telephone`, `mobile`,
`street_address2`).
Map validation errors from each error's `source.parameter` to the matching
field.

Customer type goes in `type`: `0` = private person, `1` = business. The form
switches between the two; a business customer uses the same `personnummer` key
for its organisation number, labelled "Organisationsnummer" in the UI.
`company` follows `accounts/form` like every other optional field — it is only
shown, required and sent when the store reports `display: true`.
`vat_identification_number` is intentionally not part of this frontend: the
store never returns it from `accounts/me` or the address book and PUT updates
do not persist it, so the field was removed from both registration and the
profile form.

**`company` is dropped by the store when `accounts/form` reports it as
`display: false`** — the account is created with `company: null`, which is why
the form never sends it in that case. When the field is enabled and filled in,
the new account is signed in right after `POST accounts`, so write it onto
the main address with `PUT /surface/2/accounts/me/addresses` (body
`{ addresses: [ { …address, company } ] }`, `country_id` not `country`; a flat
body answers 422) and let that write fail silently — the account itself is
already created.


Which fields the form shows comes from `GET /surface/2/accounts/form`: an
object map of `{ display, required, min_length, max_length }` per field. Hide
everything with `display: false`, mark the required ones mandatory, apply the
length limits, and never send an empty optional key. Cache the response per page
load and fall back to the documented required set if the call fails.


## Orders and password reset

- `GET /surface/2/accounts/me/order-history` and `/order-history/{id}`.
- `GET /surface/2/accounts/me/forgot-password` — requires the mutation token. Currently returns 401 `SURFACE_SESSION_UNAUTHORIZED` for guests; show an error, never re-bootstrap on it.
  even though it is a GET.
- `GET /surface/2/accounts/me` is the logged-in check (`customers/current` was removed).

## Non-negotiables

- **Never cache** account data or order history — fetch fresh on every view.
- All `accounts*` endpoints resolve to the **`default`** CORS policy, not
  `customer`. Allowlist the frontend origin there or the calls fall back to the
  proxy.

## Customer type is create-only

**Customer type cannot be changed after registration.** `POST accounts` accepts
`type` (`0` = private, `1` = business), but `PUT accounts/me` silently ignores
every variant — `type: 0`, `type: "private"`, `customer_type`,
`customers_group_id`, or any combination — and keeps answering `200` with the
original type (verified live). Show the customer type read-only in edit-account
forms; only the store admin can change it.
