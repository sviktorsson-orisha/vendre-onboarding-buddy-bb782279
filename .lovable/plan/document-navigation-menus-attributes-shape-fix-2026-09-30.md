# Document navigation menus `attributes` shape fix

## Finding
The storefront's menu code never reads the `attributes` field on menu items (it isn't even in the menu item type), so the old empty-array quirk never affected the menus. No behaviour change is needed.

## Changes
1. `.vendre/knowledge/api-reference.md`, section 2.6: add a dated note (2026-09-30) that `navigation/menus` now always returns `attributes` as an object (`{}` when empty), never an array; older installs may still send `[]`, so treat both as empty.
2. `.vendre/skills/navigation-menus.md`: short matching note.
3. `src/types/vendre.ts`: add optional `attributes?: Record<string, unknown> | unknown[]` to `MenuItem` with a comment, so the type matches the documented response. Type-only; no logic change.
