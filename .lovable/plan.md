# Product box pictures: fill the square, never white above or below

Every product picture fills a square that is as tall as it is wide. Wide photos like Coral Strap Back Dress are scaled up to fill the full height, and the left and right sides are cropped. There is never a white gap above or below a picture. Photos stay centred and are never stretched.

This replaces the earlier rule that the whole photo must fit without cropping.

## Technical details
- `src/components/store/product-card.tsx` only.
- Picture link wrapper: `block aspect-square w-full overflow-hidden`.
- `StoreImage` in the card: replace `size-full object-contain` with `size-full object-cover object-center`. StoreImage then skips its default and uses cover, so the picture always fills the square.
- No logic, font or colour changes. The product page and cart pictures are unchanged.
