# Featured products: 4 random products via VQL

## What changes for you
- The front page shows 4 random products from the whole store, fetched with VQL.
- It no longer sends a page size to the category list, so changing page sizes in Vendre admin can't break it.
- The selection is kept for 5 minutes so it doesn't jump around while browsing, then changes.

## How it works
1. One VQL request for products (the same kind of request the product page already uses), asking only for the fields a product card shows: name, price, picture, stock, link.
2. Only active, buyable products are included.
3. 4 of them are picked at random and shown.
4. If VQL is turned off in the store, it falls back to the first category without sending any page size, and still picks 4 at random.
5. Demo mode picks 4 random demo products.

## First step: confirm against the live store
Before building, test against the store which VQL options work for this: limiting how many products come back, and filtering out inactive ones. If Vendre has a random-order option, use it; otherwise fetch a capped batch (for example 50) and pick 4 at random here.

## Technical details
- `src/lib/vendre/api.ts`: new `vqlRandomProducts(count)` using `POST vql` with `query.products` (`fields: VQL_PRODUCT_FIELDS` card subset, `filters.where` on active status, VQL limit if supported), mapped via `mapVqlProduct`, Fisher–Yates shuffle, slice to `count`. On 500 → fallback to `getCategory(firstLeafId)` with no `limit`, then shuffle.
- `useFeaturedProducts`: same query key and 5 min staleTime; only the queryFn changes.
- `mockFeaturedProducts`: random sample.
- Never request `purchase_price`.
- Document the featured-products VQL body in `.vendre/skills/vql-queries.md`.
