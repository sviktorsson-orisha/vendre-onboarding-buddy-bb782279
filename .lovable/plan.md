# Product card: no border, brand line, square uncropped images

Applies to `ProductCard`, so the front page, category pages and search results all change together. The attached image is only used for layout ideas. No colours or borders are taken from it.

## Changes
1. **No border:** the card loses its outline. It keeps its white card background on the grey page.
2. **Brand name:** a small grey line with the brand appears between the image and the product name. It uses the existing `--muted-foreground` grey, the same as "Summa" in the cart. If a product has no brand, the line is left out so nothing empty shows.
3. **Square, uncropped images:** the picture area becomes a square. The whole product photo fits inside it without cropping (letterboxed on the card background). The light hover zoom stays.

## Technical details
- `product-card.tsx`: drop the border from the card (`border-0` on top of `brand-card`, so the setup guide and front-page box keep theirs). Change the image link from `aspect-4/5` to `aspect-square`, and pass `object-contain` to `StoreImage` instead of relying on its default `object-cover`.
- `store-image.tsx`: let a passed `object-contain` override the default `object-cover`. The demo placeholder is unaffected.
- Brand data: products don't carry a brand today. Add an optional `brand: string | null` to the `Product` type and fill it when products are mapped:
  - VQL (featured, search, product page): add the `manufacturer` relation (`id`, `name`) to the card field selection and map its name.
  - Category listing: map a manufacturer name from the category response if the store sends one. This is checked live against the store before building. If it's missing there, the brand line is simply hidden on category pages and I'll report it.
  - Demo data: add sample brand names to the mock products.
- Check: screenshots of a product grid at phone and desktop width, live and demo.
