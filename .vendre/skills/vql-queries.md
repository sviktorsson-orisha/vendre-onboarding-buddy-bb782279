---
name: vendre-vql-queries
description: Vendre Query Language on Surface v2 - POST vql for multi-resource queries over products, categories, manufacturers and tags, field selection, caching and the fallback when VQL is disabled on an install. Use when building search, brand grids, tagged collections or custom cross-resource data fetching.
---

# Vendre Query Language (Surface v2)

Scope: the query mechanism itself. Page behaviour lives in
`vendre-pdp-products` and `vendre-category-plp`.

## Endpoint

`POST /surface/2/vql` — CORS policy `vendre_query_language`.

## Resources

Query products, categories, manufacturers/brands, tags and related entities via
the resource map. Batch related resources into one request instead of firing one
call per widget.

## Field selection

`purchase_price` is not whitelisted by default (since 2026-09-30) and must never
be requested by the storefront — it is internal cost data.

Request only the fields the view renders. Over-fetching product payloads is the
main cause of slow PLP and search pages.

## Fallback

`POST vql` returns 500 for every body shape on installs where it is not enabled.
Detect this once and fall back to `GET /surface/2/categories/{id}` for product
data; keep the data layer switchable rather than hardcoding VQL everywhere.

## Caching

VQL results for static collections (brands, tags, curated lists) cache
aggressively, keyed by the full query **and** market/currency/language/VAT.
Never run customer-scoped data through a cached VQL query.

## Verified resources on this install

- `product_variant_types` — variant tree, filtered with
  `filters.where.product_id`. Only the **parent** product id returns rows; a
  variant child returns `[]`. Nested `product_variant_choices` → `products`
  (`id`, `in_stock`, `stock_allow_checkout`, `status`) maps a choice to real
  product ids. Request `status` and drop entries with `status: 0` — that is the
  activity flag on this install (`active` is not returned); `null`/missing means
  active.
- `products` — full record for a single id (`fields: ["_all", { image: ... }]`).
  This is the only way to read a variant child, since children are not listed in
  any category response.
- Responses are `{ query: { <resource>: [...] } }` — there is **no** `data`
  wrapper on Surface v2. Tolerate `data.query.*` defensively.
- Requested fields are not guaranteed: `quantity` is silently omitted on this
  install, so never branch on it.
- A 500 from one variant query must not flip the global "VQL disabled" flag used
  by search — treat it as "no variants" and keep rendering the page.

See `vendre-pdp-products` for the exact variant query bodies.
