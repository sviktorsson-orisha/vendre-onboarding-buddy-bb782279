# Category / product listing page (PLP)

Describes the working implementation in this project. Source: `GET /surface/2/categories/{id}`.
Single product: `pdp-products.md`. Query language: `vql-queries.md`. Endpoint source of truth: `.vendre/knowledge/api-reference.md`.

## Files

```text
src/routes/kategori.$id.tsx            route + validateSearch + head()
src/pages/CategoryPage.tsx             state, URL handling, layout
src/components/store/category-filters.tsx        filter logic + desktop sidebar
src/components/store/category-toolbar.tsx        count + desktop sorting + sort helpers
src/components/store/category-mobile-controls.tsx mobile filter/sort in Sheets
src/lib/vendre/api.ts                  useCategory + categoryQuery serialisation
src/mock/vendreResponses.ts            mockCategory (demo mode)
src/types/vendre.ts                    CategoryResponse and related types
```

## Data fields actually used

From `CategoryResponse`:

- `header.name`, `header.text` (HTML, rendered with `dangerouslySetInnerHTML`), `header.image`
- `subcategory_list[]` → `id`, `name` (rendered as button links)
- `product_list[]` → rendered by `ProductCard`
- `product_count` (shown once, in the toolbar)
- `page_index`, `page_count` (pagination; `page_limit`/`page_limits` are not exposed in the UI)
- `sort_by`, `sort_order` (to mark the active sort option)
- `sort_options` / `sorts` (fallback order) → `name`, `value` or `sort_by`+`sort_order`, `selected`
- `filters[]` → `id`, `name`, `type`, `options[] (id, name, count)`, plus `min`/`max` for type 2

Everything else the store returns is deliberately ignored.

### Filter types

| type | Meaning | Rendering | Sent as |
| ---- | ------- | --------- | ------- |
| 0 | Category filter | **Not** rendered (exists as subcategory links) | – |
| 1 | Tag filter | Checkboxes keyed on `option.id` | `tags[]=<id>` |
| 2 | Price range (`min`/`max`, no options) | Dual-handle slider | `pfrom` / `pto` |
| 4 | Spec filter (options identified by **name**, not id) | Checkboxes keyed on `option.name` | `f[{filterId}][]=<name>` |

`visibleFilters()` hides type 0 and any filter without usable values (empty `options`, or type 2 without `min`/`max`).

## State, sorting, filtering, pagination

All listing state lives in the URL — no local filter state except the slider's drag value.

`validateSearch` in `kategori.$id.tsx` normalises:

- `page` (positive number)
- `sort_by`, `sort_order` (only `ASC`/`DESC`)
- `tags` – comma-separated string, e.g. `m,xl`
- `specs` – `44:Bomull,44:Lin`, parsed into `{ "44": ["Bomull","Lin"] }`
- `pfrom`, `pto` – numbers

`setSearch(patch, resetPage = true)` in `CategoryPage` navigates with a new search function, strips empty values and resets `page` — except on page changes, where `resetPage = false`.

Sorting: **only** options the store returns. If no `sort_options`/`sorts` are present, no sort control is rendered at all. Helpers: `sortOptionsOf`, `sortKeyOf`, `currentSortKey`, `applySort`.

Responsive: desktop (`lg:`) has the filter sidebar on the left plus the sort select in the toolbar. Below `lg`, `CategoryMobileControls` renders Filter (with a badge for the active count) and Sort buttons above the product grid, opening a Sheet from the left and the bottom respectively. The same `FiltersContent` is reused in both layouts through the shared `FilterProps` object.

## How the call is made

```tsx
const { data, isLoading, isFetching, error } = useCategory(id, query);
```

`useCategory` (in `src/lib/vendre/api.ts`) picks the adapter via `useVendreApi()`:
`isConfigured` from the onboarding context → `liveApi`, otherwise `demoApi` (`mockCategory`).
Never call `liveApi` or the mock directly from a component.

- queryKey: `["vendre", api.mode, "category", id, query ?? null, scope]` where `scope` = market, currency, language and `prices_include_vat` from the session context.
- `staleTime` 5 min, `placeholderData: previous` → the old list stays visible and dims via `isFetching`.
- Live: `guarded(() => surfaceJson('categories/{id}' + categoryQuery(query)))`; `guarded` re-bootstraps on `SURFACE_SESSION_UNAUTHORIZED`/401.
- `categoryQuery` serialises: `page`, `limit`, `sort_by`, `sort_order`, `pfrom`, `pto`, `tags[]`, `f[{id}][]`.
- Demo: `mockCategory(id, query)` performs the same filtering, sorting and pagination locally so the UI behaves identically.

## Edge cases and pitfalls

- **Never invent filters or sort options.** Price filters and sort lists render only when the store returns them.
- **Spec filters (type 4) have no stable option ids** — match on `option.name`, both in the URL and in `f[..][]`.
- **Nullable lists:** `product_list`, `subcategory_list` and `filters` can be `null` in live responses. Always use `?? []` / `?.length ?? 0`.
- **Never filter in the browser** when the list is paginated — `product_count` and `page_count` come from the store.
- **Reset `page` on every filter/sort change**, otherwise the user lands on an empty page.
- **Price slider:** commit happens on `onValueCommit`, and values equal to `min`/`max` are sent as `undefined` so the URL is not filled with the default range. The filter is hidden when `max <= min`.
- **The cache key must include market/currency/language/VAT** — prices change when the context changes.
- **Show the product count in one place** (the toolbar), not also under the heading.
- **CORS:** `categories` is its own policy in the Surface configuration; gateway 401s carry CORS headers for configured origins (since 2026-09-30), so a bare CORS error means the origin isn't allowlisted.
- **Server errors** show the error box only when no previous data exists — otherwise the last successful listing is kept.
