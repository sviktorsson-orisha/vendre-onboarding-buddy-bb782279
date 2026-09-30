# Account area

## Routes

```text
/account                 layout with a top tab menu + auth guard
  /account               profile edit form
  /account/addresses     main address + list of saved addresses
  /account/users         sub-users on the account
  /account/orders        order list
  /account/orders/$id    order detail
```

The layout route renders the tabs and `<Outlet />`, and redirects to `/login`
when the session context says unauthenticated (after the ready-gate resolves —
never before, or a reload bounces the user out).

## Endpoints

| View | Call |
| --- | --- |
| Profile read | `GET /surface/2/accounts/me` |
| Profile update | `PUT /surface/2/accounts/me` (mutation token) |
| Main address | `GET /surface/2/accounts/me/addresses` (returns the customer's main address) |
| Alternative addresses | `GET /surface/2/accounts/me/address-book` (returns only the alternative addresses) |
| Orders | `GET /surface/2/accounts/me/order-history` |
| Order detail | `GET /surface/2/accounts/me/order-history/{id}` |

Never cache account data across sessions. React Query with
`staleTime: 0` and cache clearing on logout.

## Addresses view (current implementation)

- `getAddresses()` fetches `accounts/me/addresses` and `accounts/me/address-book`
  **in parallel** and returns `{ main: Address | null; alternatives: Address[] }`.
  The first entry from `accounts/me/addresses` is `main`; the whole address book
  is `alternatives`.
- Never pick "the longest list": the address book does not contain the main
  address, so a longest-wins merge silently promotes an alternative address to
  main.
- No dedupe between the two sources and no fallback — a customer always has a
  main address.
- The view is **read-only**: no editing, no headings, no badges and no generated
  labels such as "Adress 2". Address cards render address lines only.
- Layout: `grid gap-6 lg:grid-cols-2` — main address in the left column, all
  alternatives stacked in the right column; on mobile the columns stack with the
  main address first.

## Normalization

The API is inconsistent about key naming across stores and endpoints. Normalize
once at the boundary rather than in components:

```ts
function normalizeAccount(raw) {
  return {
    id: raw.id ?? raw.account_id,
    firstname: raw.firstname ?? raw.first_name,
    lastname: raw.lastname ?? raw.last_name,
    email: raw.email_address ?? raw.email,
    ...
  };
}
```

When writing back with `PUT accounts/me`, never echo the response spelling:
the update body expects `firstname` / `lastname` / `email_address`, while the
profile response returns `first_name` / `last_name` / `email`. Sending the read
aliases makes the store silently ignore those fields.


Do the same for orders: the list may arrive as an array, as `{ data: [...] }`,
or as `{ order_history: [...] }`, and order ids appear as `id`, `order_id`, or
`increment_id`. A missing normalizer is why "orders don't show up" even though
the account has orders.

### Order detail (current implementation)

`GET accounts/me/order-history/{id}` wraps everything in `order`. Each line is
`{ id, product_id, name, model, quantity, price_each, price_total, tax }` —
**no image**, and the amounts are **excluding VAT** while `totals[].text` is
already formatted and includes VAT.

- Since 2026-09-30 `price_total` is formatted text INCL. VAT (order currency)
  with `price_total_raw` as its number: show the text as the main price and
  `raw / (1 + tax / 100)` as excl. VAT under it. Older installs send only raw
  numbers excl. VAT: then show `raw * (1 + tax / 100)` as main price. Total rows stay untouched, straight from the API.
- Reuse the formatting of the last total row (prefix/suffix, e.g. `kr`) **and its
  decimal precision** so line prices match the rest of the order instead of
  hardcoding a currency. The store sends raw line amounts (`399.2`) but
  pre-rounded totals (`752 kr`); if the sample total has no decimals, round line
  prices to whole units too, otherwise use the same number of decimals.
- Fetch line images with one VQL call after the order loads:
  `POST vql` with `query.products.filters.where.id = [product_id, ...]` and
  `fields: ["id", { image: { fields: ["id","name","href"] } }]`. A failing image
  lookup must never break the order view — render the row without an image.

## Profile update

`PUT /surface/2/accounts/me` generally rejects partial bodies — send the full
required field set (same shape as registration, minus `password`), merging the
edited fields over the current account.
