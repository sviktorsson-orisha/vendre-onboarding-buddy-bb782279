# Header: drop "Contact us", restyle search

## What changes
- **Remove the "Kontakta oss" / "Contact us" button** on the right side of the desktop header.
- **Icons align right:** favorites, account and cart sit flush against the right edge on desktop, as the cart and menu icons already do on phone and tablet.
- **Search like the sketch:** no grey box or rounded frame. It becomes a white field with only a thin grey line underneath. The magnifier icon is larger and violet, and the placeholder text is a bit larger and grey. When you click into the field, the line turns violet. Search suggestions work as before.
- The search row that opens from the magnifier on phone and tablet gets the same look.

## Technical details
- `src/components/store/store-header.tsx`: delete the Contact us `Link`. The right icon group keeps `justify-self-end` in the 3-column desktop grid.
- `src/components/store/search-box.tsx`: change only the input and icon classes. Input: `rounded-none border-0 border-b border-border bg-transparent py-3 pl-10 text-base focus:border-primary`. Icon: `size-5 text-primary left-2`. No change to search logic.
- Remove the now-unused `store.contactUs` text (EN + SV) in `src/lib/i18n.tsx`.
