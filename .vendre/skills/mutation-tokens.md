---
name: vendre-mutation-tokens
description: Surface-Mutation-Protection-Token handling for Vendre Surface v2 - where the token comes from, which calls need it (including one GET), when to replace it, and how to wire forms so submits never fail silently. Use when building any form, login, cart or account mutation against Vendre.
---

# Mutation protection tokens (Surface v2)

The most common source of silent failures in Vendre frontends.

## Where it comes from

`POST /surface/2/session/bootstrap` returns
`surface_mutation_protection_token` (+ `_expires_at` / `_expires_in`, ~1 hour).
Keep it in a module-level variable or app state — **not** `localStorage` — so a
re-bootstrap always wins over stale component state.

## Where it must be sent

Header `Surface-Mutation-Protection-Token: <token>` on **every** POST/PUT/DELETE:

- `shopping-cart/products`, `shopping-cart` (DELETE), quantity updates
- `shopping-cart/coupons/activate`, `/deactivate`, `/reset`
- `login/email`, `logout`, `login/*` SSO and BankID calls
- `accounts` (registration), `accounts/me` (PUT), `accounts/me/addresses` (PUT)
- `session` (market/currency/language/VAT), `session/end`
- `contact`, `checkout/upsell/*`

Exceptions in both directions:

- `shopping-cart/coupons/check` does **not** require it.
- `GET accounts/me/forgot-password` **does** require it, despite being a GET.
  A client that only attaches the header on non-GET calls must special-case this.

## When to replace it

Always swap the stored token for the fresh one returned by:

- login (`mutation_protection_token`; older installs: `mutationProtectionToken`)
- logout
- any re-bootstrap after a session 401

Skipping this makes the *next* form post fail with an opaque error.

## Form pattern

1. **Ready-gate**: disable submit until the session `ready` promise resolves and
   a token exists — otherwise the first submit after a cold load runs token-less.
2. **Submit** with the token attached by the shared client, not per-call code.
3. **On session 401**: re-bootstrap once, replace the token, retry the submit
   silently instead of showing a raw error.
4. **On 422**: map each error's `source.parameter` to the matching form field so
   the user sees field-level validation, not a generic failure.
5. **On 429**: respect `Retry-After` and tell the user the store is busy.

Cart product mutations use `POST shopping-cart/products` only (PUT removed); the clear flag is `clear`.
