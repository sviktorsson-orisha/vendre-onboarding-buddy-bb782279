# Cart prices always 14px

In the cart, every price (new price and old crossed-out price) shows at the same size: 14px. Colours, weight and everything else stay as they are. Prices elsewhere (search suggestions, product cards, product page) are unchanged.

## Technical details
- `src/components/store/product-price.tsx`: add an optional `originalClassName` override (or a new `cart` size) so the cart can set the old price to `text-sm`.
- `src/components/store/cart-sheet.tsx`: use it so both current and original price are `text-sm` (14px). The `sm` size used by search suggestions keeps its 12px old price.
