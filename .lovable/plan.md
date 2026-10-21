# Product box: no hover zoom, text sizes

Applies to the product box used on the front page, category pages and search results.

## Changes
1. **No zoom on hover:** the picture stays still when you point at the box.
2. **Prices 16px:** the current price and the old (struck-through) price are both 16px in the product box.
3. **Product name 16px.**
4. **Brand 14px.**

## Technical details
- `product-card.tsx`: remove `transition-transform duration-300 group-hover:scale-105` from the image; name `text-sm` -> `text-base`; brand `text-xs` -> `text-sm`.
- `product-price.tsx`: change the `md` size of the old price from `text-xs` to `text-base`. Only the product box uses `md`, so the product page (`lg`) and cart (`sm`) keep their sizes. If another place turns out to use `md`, the box gets its own override instead.
