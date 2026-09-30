---
name: vendre-cart-checkout
description: Vendre Surface v2 shopping cart and checkout hand-off - live cart reads, optimistic local state with debounced background sync, quantity steppers, line removal, discount coupons, checkout upsell, and the mandatory flush-and-verify before navigating to checkout. Use when building a cart drawer or cart page, or when the cart jumps back, shows wrong totals, or arrives empty at checkout.
---

# Cart and checkout (Surface v2)

The cart must feel instant locally **and** always be true in the store before
checkout.

## Live reads

- `GET /surface/2/shopping-cart` — lines, totals, coupons.
- **Never cache**: `staleTime: 0`, `gcTime: 0`, refetch on view load. The
  optimistic layer below is the only client-side state, and it is always
  reconciled against the store.

## Optimistic local state

- Quantity changes, line removals and totals update **immediately** in the UI.
  No spinner on plus/minus, no waiting for the network.
- Local state is a layer on top of the server cart, keyed per line item.

## Debounced background sync

- Every change schedules an async sync to
  `PUT /surface/2/shopping-cart/products` (add / set quantity) or
  `PUT /surface/2/shopping-cart/products` with `quantity: 0` (remove a single
  line — `DELETE /surface/2/shopping-cart` empties the entire cart), always with
  `Surface-Mutation-Protection-Token`.
- **Debounce ~400–600 ms** and coalesce: rapid consecutive changes to the same
  line collapse into **one** request carrying the latest state. Last write wins.
- Keep at most **one inflight sync**; queue the newest pending state and fire it
  when the current request resolves. Never build a backlog of intermediate
  quantities — it wastes quota and can race into wrong totals.
- Add payloads may carry `attributes`, `comments` and `data`, and support the
  batch form `{ "products": [...] }`.

## Reconcile

- On success: invalidate the cart query and replace the local view with the
  store's response. Prices, discounts, coupon effects and stock adjustments are
  the server's truth, not the client's arithmetic. Item counts and totals must
  update everywhere at once (header badge, drawer, cart page).
- On failure: roll back the optimistic change, show a discreet message, refetch.
- Session 401 during sync: re-bootstrap once, replace the mutation token, retry.

## Coupons

- `POST shopping-cart/coupons/check` — validate (no mutation token needed).
- `POST shopping-cart/coupons/activate`, `/deactivate`, `/reset` — all require
  the mutation token. Any coupon change invalidates the cart like a line change.

## Upsell

`POST /surface/2/checkout/upsell/get-prices` and
`POST /surface/2/checkout/upsell/add-products`, both with the mutation token.

## Flush and verify before checkout

The checkout button must not navigate immediately:

1. Flush all pending/debounced mutations and await them.
2. Fresh `GET /surface/2/shopping-cart`.
3. Mint a hand-over token with
   `POST /surface/2/session/handover` (mutation token required), body
   `{ "return_url": "<origin>/", "failure_url": "<origin>/" }` — both absolute
   URLs on the same host as the browser origin. The response carries
   `checkout_url` (and `handover_key`), valid for ~30 seconds, so mint it at the
   moment of navigation, never in advance.
4. **Real browser navigation** to `checkout_url` (never `fetch`). The token
   carries the cart across even when the session cookie does not.
5. If the hand-over call fails, fall back to `<store base>/checkout` so the
   button never dead-ends.

Show the button in a short pending state while this runs; it is the one place
where waiting is correct. The proxy must forward the browser's `Origin` and
`Referer` headers, otherwise the store answers
`400 SURFACE_SESSION_HANDOVER_UNKNOWN_ORIGIN`.


## Line field name

Cart lines identify the product with `product_id` (formerly `productId`). Requests still send `{ "products": [{ "id", "quantity", "attributes" }] }`.
