# Correct cart total when the session currency isn't SEK

## What is happening
With EUR set in the session, Vendre sends each cart line in euros (e.g. sofa `279,65 €`) but the cart total `cart_total: 3145.8` still comes back in the store's base currency (SEK). The storefront then puts a euro sign on that SEK number, so the total shows about 3 145,80 € when it should be about 279,65 €. Vendre sends no ready-made total string and no exchange rate, so the storefront can't convert it.

This is a bug on Vendre's side (the total should come in the session currency). Until they fix it, the storefront can work around it.

## What changes
1. **Total built from the store's own line prices:** add up each line's final price (already in the session currency) × quantity. Use Vendre's number for the total only when it matches that sum closely. That covers SEK, where both agree.
2. **Formatting follows the session currency:** use the store's own currency rules from the session (decimals, separator, symbol before or after), so EUR shows `279,65 €` and SEK shows `3 146 kr`, the same as the product prices. The same rule applies wherever the storefront formats a price itself (product boxes/PDP fallbacks), not just in the cart.
3. **Ready for a currency switcher later:** a currency change already clears cached prices. The cart refetches too, so nothing else is needed now.
4. **Documentation:** note the Vendre total-currency issue in `api-reference.md` and the cart skill, so the workaround can be removed once Vendre fixes it.

## Known limitation
If a coupon or cart-level discount is active in a non-base currency, the added-up total won't include it, because Vendre only reports that discount in SEK. The checkout itself is unaffected, since Vendre calculates the real amount there.

## Technical details
- `format.ts`: `formatAmount(value, currency)` takes the session `currency` object. It reads `decimal_places`, `decimal_separator`, `thousands_point`, `symbol_left` and `symbol_right` by parsing the values out of the `formatter` string (it is never run as code) and falls back to Intl.
- `cart-sheet.tsx`: `cartTotal = sum(line.product_data.price_raw ?? parse(line.final_price)) * quantity`. Prefer `cart_total` only if within 0.01 of the sum.
- `product-price.tsx` / `api.ts` fallbacks pass the session currency.
