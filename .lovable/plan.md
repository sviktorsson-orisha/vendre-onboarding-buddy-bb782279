# Product page image: follow global radius (0)

The product image uses `rounded-2xl`, which is calculated as global radius + 8px, so it stays rounded even though the global radius is 0.

## Change
In `src/pages/ProductPage.tsx`:
- Main product image (line ~240): replace `rounded-2xl` with `rounded-lg` (= exactly `var(--radius)`, currently 0).
- Loading skeleton image (line ~106): replace `rounded-xl` with `rounded-lg` so it matches.

No other styling, colors, fonts or logic change.
