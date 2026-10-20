# Remove all shadows and make the page background white

## What changes
- **No shadows anywhere:** product cards, header, search, setup banner/guide, menus, pop-ups, side panels, buttons and inputs lose their drop shadows.
- **White background:** the page background becomes pure white by default (light mode). Dark mode stays as it is.
- **Keyboard focus stays visible:** the outline you see when tabbing through links and buttons is kept, so the store remains usable without a mouse.

## Technical details
- `src/styles.css` `:root`: `--background: oklch(1 0 0)` (only the value changes; structure untouched).
- `src/styles.css` `@theme inline`: neutralize Tailwind's shadow scale (`--shadow-*`, `--inset-shadow-*`, `--drop-shadow-*` set to `none`) so every `shadow-*` class renders nothing, including shadcn components in `src/components/ui/`.
- Remove literal `shadow-*` classes from `store-header.tsx`, `search-box.tsx`, `setup-notice-bar.tsx`, `setup-wizard.tsx` and any `box-shadow` in custom CSS.
- Keep `ring-*` focus styles (they also use box-shadow internally) so focus indicators still work.
- Verify with a screenshot at desktop and phone width.
