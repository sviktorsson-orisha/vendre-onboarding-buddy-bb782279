# Adapt order history to Vendre's new price fields

## Finding
- **Order details are affected.** Today each order line arrives with plain numbers (`price_each: 399.2`, `price_total: 399.2`, excluding VAT). The app turns those into prices itself, using the currency and rounding of the order's total row. Elsewhere in Surface v2, Vendre sends a price field as ready-made text (`price`) plus a matching number (`price_raw`). If orders now follow that pattern, `price_each` / `price_total` become text, the app can't read them as numbers, and line prices could show blank or wrong.
- The order list shows `total` as text, so it most likely keeps working.
- The store has no quotation page, so nothing to change there beyond the docs.
- Vendre's note doesn't list the exact new field names. So step 1 is to check a real order response.

## Steps
1. **Verify:** look at a real order response on the store (needs a signed-in customer with at least one order; I'll ask for a test account only if I can't reach one another way). Confirm the names of the text and number fields for each line price and for the order totals.
2. **Order lines:**
   - Read the numbers from the new `*_raw` fields first, with the old plain-number fields as a fallback so older stores keep working.
   - When Vendre supplies ready-made text for a price, show it as-is instead of formatting it in the app.
   - Keep the existing incl./excl. VAT display.
3. **Order list and totals:** use Vendre's ready-made text when present. The number fields are only a fallback.
4. **Currency:** line prices now follow the order's own currency and VAT, not the shopper's current currency, so the app will stop reusing the session currency for order lines.
5. **Docs:** update the order-history section in `api-reference.md` with the verified shape and add a quotations note. Adjust `customer-account` skill docs where they describe raw-only line prices.

## Technical details
- File: `src/lib/vendre/account.ts` (`normalizeOrder`, `normalizeTotals`, `normalizeOrderDetail`, `moneyFormatter`, `toNumber`).
- Mock data in `src/mock/vendreAccount.ts` updated to the new shape.
- No change to cart, product or checkout pricing.
