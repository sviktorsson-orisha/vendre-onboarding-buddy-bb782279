# Text colours: only black and grey

## What changes
- Two global text colours, set in the style file:
  - **Text** — black, for names, headings, prices, menu links.
  - **Text muted** — the grey used today in the breadcrumbs, brand line and "Summa".
- Every purple text in the store becomes one of these two:
  - Black: the "vendre" wordmark in header and footer, header icons (account, cart, search magnifier), "See all" links in the mega menu, "Show all results" in search, footer payment names, social icons, "Clear filters", links inside CMS pages (still underlined), selected variant on the product page.
  - Hover on links (product names, menu, breadcrumbs, footer, cart items) no longer turns purple: black links get an underline on hover, grey links turn black.
- Purple stays only as a **background** colour (buttons, announcement bar, mobile footer bar, filter count badge). Text on those keeps its white button text colour, which is not a text-colour choice but part of the button settings.
- The setup guide and setup banner (shown only until the store is connected, removable later) are left as they are.

## Technical details
- `src/styles.css` `:root`: add `--text: oklch(0 0 0)` and `--text-muted: oklch(0.5 0.01 285)`; point `--foreground`, `--card-foreground`, `--popover-foreground` at `var(--text)` and `--muted-foreground` at `var(--text-muted)`, so existing `text-foreground` / `text-muted-foreground` classes keep working. Register `--color-text` / `--color-text-muted` in `@theme inline`. `.dark` gets matching light values.
- Replace `text-primary` / `hover:text-primary` / `lg:text-primary` / `[&_a]:text-primary` in: store-header, store-footer, search-box, account-menu, breadcrumbs, product-card, cart-sheet, category-filters, ProductPage, ContentPage, Index (eyebrow).
- Hover rule: `hover:underline` on black links, `hover:text-foreground` on grey links.
- `brand-gradient-text` utility is only used in the setup guide; untouched.
- No logic changes.
