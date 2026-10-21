# Product box: no name underline, full-width bottom button

- The product name no longer gets underlined (or changes at all) when you point at it.
- The "Lägg i kundvagn" / "Läs mer" button sits at the very bottom of the box, edge to edge, with no white space around it. Buttons still line up across a row, since boxes in a row share the same height.

Applies everywhere product boxes are shown (front page, category pages, search).

## Technical details
- `src/components/store/product-card.tsx`: remove `hover:underline` from the name link.
- Move the button/link out of the `p-4` text block so it is a direct child of the `article` (flex column); text block keeps `grow`, button gets `mt-auto h-10 w-full justify-center` with no outer padding. No logic changes.
