# Handle Vendre's new cart total format

## What changes for the customer
Vendre now sends the cart total as ready-made text (e.g. "187,50 kr") and the plain number separately. The cart panel shows Vendre's text directly, so the total follows the store's own currency and number format. This may also fix the earlier problem where the total was wrong when the session currency was euro, so we'll check that too.

## Steps
1. **Read the new format when loading the cart.** If the total comes as text, show that text as-is and use the new plain-number field for any calculations. Older stores that still send only a number keep working as before.
2. **Cart panel.** Nothing to change here: it already prefers ready-made text and only formats the number itself as a fallback.
3. **Docs.** In the API reference, add a dated section explaining that the total is now text and the plain number comes in a new field. Note that the text depends on the session's market and language, and that calculations should use the plain number. Add a short note to the cart guides as well.
4. **Check against the live store.** Load the cart through our server in SEK, and in EUR if possible. Confirm the total is text, the plain number is there, and the panel shows the right total.

## Technical details
- `src/types/vendre.ts`: add `cart_total_raw?: number | null` to `Cart`. After normalizing, `cart_total` stays a number internally.
- `src/lib/vendre/api.ts`, in `getCart`: if `typeof cart_total === "string"`, set `cart_total_formatted = cart_total` and `cart_total = Number(cart_total_raw)`. If `cart_total_raw` is missing, fall back to parsing the text.
- `cart-sheet.tsx` and the demo cart are unchanged.
- Docs to update: `.vendre/knowledge/api-reference.md`, `cart-checkout.md`, `cart-sync.md`.
