# Category page header redesign

Fonts and colours stay exactly as they are; only layout changes.

## What changes
- **Category image on top:** when the category has an image, it shows at the very top of the page content, above the breadcrumbs, stretching the full width of the screen (edge to edge, not limited to the content width).
- **Fixed height, cropped:** the image has a set height (about 160px on phones, 220px on tablet, 280px on desktop) and is cropped to fill it, centred, never stretched.
- **No image = no space:** if the category has no image, nothing is shown and the page starts with the breadcrumbs as today.
- **Below the image:** breadcrumbs, then the category name, then the description in a narrower readable column — matching the sketch. The old image column on the right of the heading is removed.
- **Phones:** the description is shortened to about 3 lines with a "Läs mer" link that expands the full text (as in the sketch's mobile view). On tablet and desktop the full text is shown.
- Subcategory buttons, filters, sorting and the product grid are unchanged.

## Technical details
- `StoreShell`: add an optional `hero` prop rendered inside `<main>` before the max-width container (full-bleed).
- `CategoryPage`: pass `<StoreImage image={data.header.image} className="h-40 md:h-56 lg:h-72 w-full object-cover" />` as `hero` only when `data.header.image` exists; drop the right-hand image column and `lg:grid-cols-3` header grid; description `max-w-2xl`.
- Mobile clamp: `line-clamp-3 md:line-clamp-none` with local `expanded` state toggling a "Läs mer"/"Visa mindre" text button (new i18n keys, styled as underlined text, existing tokens).
- No data, logic or API changes.
