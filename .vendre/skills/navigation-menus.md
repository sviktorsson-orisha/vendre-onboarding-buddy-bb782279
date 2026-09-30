---
name: vendre-navigation-menus
description: Vendre Surface v2 navigation - navigation/menus for header, mega menu, drawer and footer, menu item types and routing, breadcrumbs from the category hierarchy, and active state. Use when building site navigation or breadcrumbs against Vendre.
---

# Navigation and breadcrumbs (Surface v2)

## Endpoints

- `GET /surface/2/navigation/menus` — header, mega menu, drawer, footer.
- `GET /surface/2/categories/{id}` — category details for breadcrumb chains.

Menu item `attributes` is always an object (`{}` when empty) since 2026-09-30;
older installs may send `[]` — treat both as empty.

## Routing by menu item type

`GET navigation/menus` returns **both** product categories and CMS pages in one
flat list. They are different entities and must not be treated alike:

| `menu_type`        | Entity            | Route                | Placement |
| ------------------ | ----------------- | -------------------- | --------- |
| `category`         | product category  | `/kategori/{id}`     | header    |
| `information_page` | gallery (CMS page)| `/sida/{entity_id}`  | footer    |
| external/URL       | link              | plain `<a>`          | anywhere  |

Rules that this project implements:

- **Header shows categories only** — `useCategoryMenu()` filters
  `menu_type === "category"`.
- **Footer shows CMS pages only, and is built from `GET galleries/pagetree`** —
  not from `navigation/menus`, which has no `is_menu` field. `usePageMenu()`
  keeps only top-level nodes (`parent_id` 0/null) with `is_menu: true` **and** at
  least one active child page. Ordinary content pages such as "Inspiration"
  (`is_menu: false`) are therefore never rendered in the footer, even though
  `navigation/menus` lists them as `information_page`. No hardcoded/dummy links.
- For information pages the gallery id is `entity_id` (equal to `id` in current
  payloads). `target` is a legacy absolute storefront URL
  (`https://store.example/about-us/`) — never link to it; use the internal
  `/sida/{entity_id}` route.
- Nest with `parent_id` **and** `parent_source`: a category and an information
  page can share the same numeric id, so tree keys are `source:id`
  (`buildMenuTree` in `src/lib/vendre/api.ts`).
- Page content comes from the page's own `description` in `GET galleries/{parent_id}/pages` — content blocks are NOT used
  (`vendre-cms-pages`), never from `categories/{id}`.

## UX

Accessible, responsive mega menu and drawer; breadcrumbs built from the Vendre
category hierarchy; the active category/page highlighted from the current route
params.

## Caching

Menus and category trees change rarely — cache aggressively with
stale-while-revalidate, keyed by language/market (`vendre-caching`).
