---
name: vendre-cart-sync
description: Cart UX and synchronisation for Vendre Surface v2 - optimistic local state, debounced async background sync to shopping-cart endpoints, rollback on failure, and a mandatory flush-and-verify before handing the visitor to checkout. Use when building a cart, cart drawer, quantity stepper or checkout button against Vendre.
---

# Cart: local first, live sync to the store (Surface v2)

The cart must feel instant locally **and** always be true in the store before
checkout.

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
- Keep at most **one inflight sync at a time**; queue the newest pending state
  and fire it when the current request resolves. Never build a backlog of
  intermediate quantities — it wastes quota and can race into wrong totals.
- Add payloads may carry `attributes`, `comments` and `data`, and support the
  batch form `{ "products": [...] }`.

## Reconcile

- On success: invalidate the cart query and replace the local view with the
  store's response. Prices, discounts, coupon effects and stock adjustments are
  the server's truth, not the client's arithmetic.
- On failure: roll back the optimistic change, show a discreet message, refetch
  the cart.
- Session 401 during sync: re-bootstrap once, replace the mutation token, retry.

## Flush and verify before checkout

The checkout button must not navigate immediately:

1. Flush all pending/debounced mutations and await them.
2. Do a fresh `GET /surface/2/shopping-cart`.
3. Compare lines and quantities with the local state.
   - Match → proceed with a **real browser navigation** to the store's checkout
     page (never fetch; the session cookie is what carries the cart over).
   - Mismatch → update the view and let the customer confirm rather than sending
     them into checkout with the wrong order.

Show the button in a short pending state while this runs; it is the one place
where waiting is correct.

## Coupons

`coupons/check` (no mutation token), `coupons/activate`, `coupons/deactivate`,
`coupons/reset` (all three need the token). Any coupon change invalidates the
cart the same way a line change does.

## Never cache

Cart reads are always fresh (`staleTime: 0`, `gcTime: 0`). The optimistic layer
is the only client-side "cache" and it is always reconciled against the store.
