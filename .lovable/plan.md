# Faster content-heavy pages (campaign pages, categories)

## Goal
Pages open almost instantly even when customers fill them with campaign text, images and product rows.

## What we build
1. **Load on hover for all menu links** – when a visitor rests the pointer on (or taps) a link to a category or an information page, its content is fetched in the background. Clicking then opens the page from memory. Same as product boxes already do today. Covers: header categories, mega menu, mobile menu, footer pages, breadcrumbs.
2. **Pictures inside page text load when scrolled to** – images in information/campaign pages get lazy loading, except the first one, which loads first. Big pictures are fetched at a size that fits the screen.
3. **Placeholders instead of a spinner** – information and category pages show grey shapes of text and product boxes while loading, so the page doesn't jump.
4. **Keep visited pages in memory** – information pages and categories stay cached for a few minutes, so going back and forth is instant (cart, login and account stay live).
5. **Instructions for future content** – project notes explain how new page sections get hover-loading and scroll-loading automatically.

## How we check it
Test browser: hover a category and an information page link, confirm one background fetch, click and confirm the page opens with no new fetch and no spinner.

## Technical details
- New `usePrefetchCategory` / `usePrefetchPage` in `src/lib/vendre/api.ts`, using the exact query keys of `useCategory(id, defaultQuery)` and `usePageContent(id)`, 120 ms intent timer (shared `useIntent` helper extracted from `product-card.tsx`).
- Wire into `store-header.tsx` (nav, MegaPanel, MobileNavList), `store-footer.tsx`, `breadcrumbs.tsx`.
- `prepareCmsHtml` adds `loading="lazy" decoding="async"` to `<img>` (first image eager) and routes store images through the sized image proxy.
- Skeletons in `ContentPage.tsx` and `CategoryPage.tsx` replacing the spinner.
- staleTime 5–10 min for categories/pages per `.vendre/skills/caching.md`; notes added there.
