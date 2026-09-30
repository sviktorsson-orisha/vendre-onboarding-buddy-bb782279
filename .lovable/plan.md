# Adapt to Vendre's snake_case field rename

## Why the cart broke
Vendre now returns `product_id` instead of `productId` on each cart line. The store still reads `line.productId`, which is now empty. As a result:
- changing quantity or removing a product sends `id: undefined`, so nothing happens
- adding a product that is already in the cart no longer adds to the existing quantity
- product links and names in the cart point to `#undefined`

## Changes

1. **Cart line type** (`src/types/vendre.ts`): rename `productId` to `product_id`. Rename `Cart.mutationProtectionToken` to `mutation_protection_token`.
2. **Reading the cart** (`src/lib/vendre/api.ts`): `getCart` maps every line to `product_id` and accepts the old `productId` too, so both older and newer store versions work. If the cart response includes a new `mutation_protection_token`, save it.
3. **Cart actions** (`api.ts`): add, change quantity, remove and the "already in cart" check all use `line.product_id`. The request body stays `{ products: [{ id, quantity, attributes }] }`, because the release note does not list any change to request field names.
4. **Demo cart** (`api.ts`, `src/mock/vendreResponses.ts`): demo lines use `product_id`.
5. **Cart drawer** (`src/components/store/cart-sheet.tsx`): links and fallback names use `line.product_id`.
6. **Other renamed fields we read**: `account.ts` and `test-connection.ts` already check `mutation_protection_token` before `mutationProtectionToken`, so they need no change. Favorites, upsell prices and BankID status are not used in the app yet, so only the docs change for those.
7. **Documentation**:
   - `.vendre/knowledge/api-reference.md`: add a "Field name changes (snake_case)" section with the full list from the release note: cart `product_id` and `mutation_protection_token`; favorites `customer_id`, `type_id`, `product_id`; upsell `price_excl_raw` and `price_raw`; BankID `hint_code`; OpenAPI `order_id`, `quotation_id`, `bearer_auth`. Note that `visitorid` did not change. Show the cart line shape and switch the path placeholders to `{order_id}` and `{quotation_id}`.
   - `.vendre/knowledge/general.md`: change the token note to `mutation_protection_token`.
   - `.vendre/skills/cart-checkout.md` / `cart-sync.md`: mention that the line field is `product_id`.

## Check
Run a typecheck, then use the live store to add a product, add it again (quantity should go up), change the quantity and remove it.
