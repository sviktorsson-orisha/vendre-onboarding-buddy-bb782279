# Orisha white-label header and footer

## What the sketches show
- **Colors:** deep violet primary (about #2E0F8C) on buttons, the newsletter send button, social icons and the mobile/tablet footer bar. A darker plum (about #2C0060) for the top announcement bar. Light lavender tint (about #EFEBFA) for social icon circles and the desktop payment strip. Near-white page background (#F4F4F4), white cards, dark gray text (#333) and mid-gray secondary text. Yellow cart badge (about #F5B82E).
- **Type:** Poppins everywhere, medium/semibold headings, regular body.
- **Shapes:** soft corners (about 8px) on inputs and the send button, fully rounded "Contact us" button and icon circles, thin light borders.

## 1. Design variables (src/styles.css)
Only values inside `:root` and `.dark` change. `@theme inline`, `@layer base` and every `@utility` stay as they are.
- `--primary` violet, `--secondary` lavender tint, `--accent` lavender, `--background` #F4F4F4, `--card` white, `--foreground` #333, `--muted-foreground` gray, `--border`/`--input` light gray, `--ring` violet, `--brand-pink` and `--brand-blue` replaced with the plum bar color and the yellow badge color (token names kept, values updated). All values in oklch.
- `.dark`: a matching dark set (deep plum background, lighter violet primary).
- `--radius: 0.5rem`.
- Fonts: the `--font-sans`/`--font-display` lines live inside `@theme inline`. Only their values change to "Poppins". Poppins is loaded via a `<link>` in the root route head.

## 2. Header (mobile first)
- **Default (mobile):** plum announcement bar with one centered line of text. Below it: logo on the left, then search, account, cart and menu icons on the right. Menu opens the existing side drawer. Search opens the existing search row.
- **md (tablet):** same structure with more side padding and larger logo and icon spacing.
- **lg/xl (desktop):** the announcement bar shows the message three times across. Logo, wide underline-style search in the center, then favorites, account, cart with yellow count badge, and a pill "Contact us" button. Below that a plain category row with the existing mega menu. Hamburger and search icon hidden.
- The announcement text and Contact us link are placeholders. The store name/logo still comes from the store session.

## 3. Footer (mobile first)
- **Default (mobile):** logo, newsletter heading and text, email field with violet send button, four social icons in lavender circles, then link groups as accordions (existing store page groups), then a violet bottom bar with payment logos and copyright centered.
- **md (tablet):** same stacked layout, wider padding and a full-width email field.
- **lg/xl (desktop):** newsletter text on the left and email field on the right in one row. Below it a 5-column grid (page groups plus "Follow our socials"). Then a row with legal links on the left and copyright on the right. Then a lavender strip with payment logos on the left and carrier logos on the right. No accordions.
- The newsletter form is visual only. Social links, payment and carrier logos are simple placeholder badges/icons until real ones are supplied.

## Technical details
- Files: `src/styles.css` (values only), `src/routes/__root.tsx` (Poppins link), `src/components/store/store-header.tsx`, `src/components/store/store-footer.tsx`, and new i18n keys for the new texts (EN + SV).
- Existing logic stays: category menu/mega menu, prefetch on hover, cart sheet, account menu, search box, `usePageMenu` groups.
- Layout uses unprefixed classes for mobile, `md:` for tablet, and `lg:`/`xl:` for desktop. Header rows use grid + `min-w-0` + `shrink-0` so they hold up on narrow screens.
- Check with screenshots at 390, 768 and 1440 px widths.
