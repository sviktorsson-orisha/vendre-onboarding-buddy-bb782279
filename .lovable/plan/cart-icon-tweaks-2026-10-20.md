# Cart icon tweaks

- Trash can icon: grey (the store's border colour) instead of purple, moved to the top right corner of each cart item.
- Plus and minus icons: black instead of purple.

## Technical details
In `src/components/store/cart-sheet.tsx`:
- Remove the trash button from the quantity row; place it in a flex row next to the product name (`items-start justify-between`), so it sits top-right. Colour `text-border` (hover slightly darker via `hover:text-muted-foreground`), no background on hover.
- Plus/minus buttons: `text-foreground` instead of `text-primary`.
