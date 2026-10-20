# Featured products: 4 random products, no fixed page size

## What changes for you
- The front page shows 4 random products from the store instead of the first 4 of one category.
- It no longer sends a fixed amount (12) to Vendre, so it works whatever page sizes are set in Vendre admin.
- The mix changes when the visitor reloads later (kept for 5 minutes so it doesn't jump while browsing).

## How it works
1. Ask Vendre for the first category's products **without a size**, so Vendre uses its own default page size (always accepted).
2. If that category has fewer than 4 products, also read the next categories from the menu until there are enough.
3. Pick 4 products at random from what came back, skipping duplicates.
4. Demo mode picks 4 random demo products the same way.

## Same problem elsewhere
The category page also had 12/15/20 hardcoded. It will instead use the page sizes Vendre itself lists in each category response (`page_limits`), and only send a size Vendre has said it accepts; otherwise it sends none.

## Technical details
- `src/lib/vendre/api.ts`: `useFeaturedProducts` calls `getCategory(id)` with no `limit`, walks leaf categories from the cached menu until >= count products, then Fisher–Yates shuffles and slices. Query key unchanged, staleTime 5 min.
- Remove the hardcoded `ALLOWED_PAGE_SIZES`; `categoryQuery` only sends `limit` when it is in the last known `page_limits` from the store (cached per category), else omits it. `allCategoryProducts` walks pages using the store's default page size and stops at `page_count`.
- `mockFeaturedProducts` returns a random sample.
- Update `.vendre/skills/category-plp.md` and `api-reference.md` note: page sizes are store-configured, read them from `page_limits`.
