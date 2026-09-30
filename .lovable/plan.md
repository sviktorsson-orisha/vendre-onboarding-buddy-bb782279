# Switch cart changes to POST-only

## Why the cart still fails
The store now only accepts `POST /surface/2/shopping-cart/products`. The `PUT` route has been removed. All three cart actions (add, change quantity, remove) still send `PUT`, so the store turns every one of them down.

## Changes

1. **Cart actions** (`src/lib/vendre/api.ts`): `addToCart`, `updateQty` and `removeLine` send `POST` instead of `PUT`. The body stays `{ products: [{ id, quantity, attributes }] }`, which is the wrapped form the store still accepts. Removing a single line still sends `quantity: 0`. The outdated comments that say "PUT is the current contract" are removed. The app never sends the `empty` flag, so there is nothing to rename in code.
2. **Documentation**:
   - `.vendre/knowledge/api-reference.md`: the cart table row becomes `POST shopping-cart/products`, with body `{ products: [...], clear }`. Add a note that PUT and the bare top-level array body are gone, `empty` is now called `clear`, and malformed bodies return the standard `{ errors: [...] }` format. The line in the field-rename section that says "PUT ... is unchanged" is corrected.
   - `.vendre/skills/cart-checkout.md`, `cart-sync.md`, `mutation-tokens.md`: replace PUT with POST and mention `clear`.

## Check
Run a typecheck, then use the live store through the proxy to add a product, add it again, change the quantity and remove it, and confirm each change comes back from the store.
