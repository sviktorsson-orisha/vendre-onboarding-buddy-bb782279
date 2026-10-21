# Mega menu: "View all" link at the top left

In the category dropdown in the header:
- The "Visa allt i …" link moves from the bottom to the top left of the menu, above the subcategory columns, like in the sketch.
- The horizontal line above it is removed.
- Text, fonts, colours and the arrow icon stay exactly as they are.

## Technical details
- `src/components/store/store-header.tsx` (MegaPanel): move the view-all `<div>` before the columns grid; change its wrapper from `mt-8 border-t border-border pt-4` to `mb-6`. Link classes unchanged.
