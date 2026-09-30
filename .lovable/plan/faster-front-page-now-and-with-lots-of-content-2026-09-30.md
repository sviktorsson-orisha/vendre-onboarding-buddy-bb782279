# Faster front page, now and with lots of content

## What is slow today
The front page shows the store frame first and only then starts asking the store for the menu and featured products, so the products pop in late with an empty space in the meantime. With many sections later on, each would wait the same way and all their code would load up front.

## What we build
1. **Content ready on first load** – the menu and featured products are fetched while the page is being prepared on the server, so the visitor gets a page with products already in it. If the store doesn't answer in time, the page loads as today and fills in afterwards.
2. **Placeholders instead of empty gaps** – grey product-box shapes show while products load, so the page doesn't jump.
3. **Load lower sections when scrolled to** – a ready-made "section" wrapper that loads a section's products and pictures only when the visitor gets near it. Future front-page blocks (banners, product rows, content) use it automatically.
4. **Pictures in the right order** – the first visible pictures load first; everything further down waits.
5. **Short caching of front-page content** – the menu and front-page products are reused for a few minutes when visitors move around and come back, so the front page opens instantly on return (cart and account stay live, as today).
6. **Guide for future content** – a short note in the project's instructions on how to add new front-page sections so they stay fast.

## How we check it
Measure in a test browser before and after: time until products are visible, and number of calls to the store on first load.

## Technical details
- Front page route gets a `loader` using `queryClient.ensureQueryData` with the same query keys as `useMenuTree`/`useFeaturedProducts`, going through the existing same-origin proxy; timeout fallback so SSR never blocks long. Demo mode keeps using mock data.
- Components switch to reading the prefetched cache (no double fetch after hydration).
- `LazySection` component using IntersectionObserver (rootMargin ~400px) gating `enabled` on queries and lazy-importing heavy blocks.
- First-row images `loading="eager"` + `fetchpriority="high"`, others `loading="lazy"`.
- Per the caching rules: static/read-heavy data cached, cart/session/account never.
- Documented in `.vendre/skills/caching.md` and `AGENTS.md`.
