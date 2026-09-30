# Make hover preloading actually fetch product data

## Why it doesn't feel faster today
Hovering a product link only preloads the page's *code*. The product itself (name, price, images, variants) is fetched by the product page after it opens. The page has no route loader, so the router has nothing to fetch in advance. That fetch is the slow part, so the click feels the same as before.

## What changes
- When a customer hovers over or focuses a product card (image, name or "Read more"), the store fetches that product in the background, the same way the product page does.
- On click, the product page finds the product ready in memory and shows it right away.
- Each product is fetched at most once per 5 minutes. Hovering several times doesn't cause extra store calls, and brushing quickly across the list doesn't trigger any either.
- No change to how prices, variants or stock work.

## Technical details
- New `usePrefetchProduct()` hook in `src/lib/vendre/api.ts`. It returns a `(id) => void` that calls `queryClient.prefetchQuery` with exactly the same key and `queryFn` as `useProduct`: `["vendre", mode, "product", id, scope]` with `staleTime` 5 min. It skips when `scope` is null, so the cache key always matches.
- Short intent delay (about 120 ms via a timer that is cleared on mouse leave) so quick passes over the grid don't fetch.
- `src/components/store/product-card.tsx`: attach `onMouseEnter`/`onFocus`/`onTouchStart` (and clear on `onMouseLeave`) to the card's links.
- Verification: a test browser hovers a card, confirms the product request fires once, clicks, and confirms no new product request on arrival.
