# Grey page background from the sketches

Change the default page background from white to the light grey used in the Orisha sketches (#F4F4F4). Product cards, the header, footer, menus and pop-ups stay white, so they stand out against the grey. Dark mode is unchanged.

## Technical details
- `src/styles.css` `:root`: `--background: oklch(0.9702 0 0)` (#F4F4F4). Only the value changes; `--card` and `--popover` stay `oklch(1 0 0)`. Structure of the file untouched.
