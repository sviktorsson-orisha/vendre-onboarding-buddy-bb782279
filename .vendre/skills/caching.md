---
name: vendre-caching
description: What to cache and what never to cache in a Vendre Surface v2 storefront - static navigation/category/CMS/product/VQL data vs live cart, session and account data, cache keys that include market/currency/VAT, invalidation after session changes, and server-side filtering. Use when setting up query caching or debugging stale prices, counts or totals.
---

# Caching strategy (Surface v2)

## Cache aggressively (static, read-heavy)

- `GET navigation/menus` — header, mega menu, footer
- `GET categories/{id}` category trees and listings
- CMS: `galleries/pagetree`, `galleries/{id}/pages`, `galleries/boxes`
- Product data and `POST vql` results
- `GET sitemap`

Key these caches by everything that changes their content: category id, page,
sort, filters, **and** market/currency/language/VAT from session context.

## Never cache (live per visitor)

- `GET shopping-cart*` — cart, totals, coupons
- `GET session`, `GET session/context`
- `GET accounts/me*`, order history

Use `staleTime: 0` and `gcTime: 0` for these, and refetch on view load.

## Cart is a special case

The cart has an **optimistic local layer** on top of server data
(`vendre-cart-checkout`). It is not a cache: every mutation is synced to the
store and the cart query is invalidated when the sync lands, so item counts and
totals update everywhere at once.

## Session changes invalidate prices

After `POST session` (market, currency, language, `prices_include_vat`),
invalidate every price-bearing cache — categories, products, cart — or the page
keeps rendering the old currency and VAT mode.

## Token caching

The OAuth bearer is cached **server-side** on `globalThis` for its full ~1h
lifetime (`vendre-surface-v2`). Session data is never cached server-side — it is
per visitor.

## Filter and paginate on the server

Send `sort_by`, `sort_order`, `page`, `limit`, `tags[]`, `filter`/`f`, `pfrom`,
`pto` to the API and render the list, `product_count` and page count from the
response. Keep filter state in the URL so the cache key and a shared link agree.
