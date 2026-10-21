# Product box pictures: fill the square, crop the sides

Every product picture fills a square that is as tall as it is wide. Wide photos, like the one for Coral Strap Back Dress, fill the full height and lose a bit on the left and right. The photo stays centred and is never stretched. This means no more empty white bands above and below wide photos.

This replaces the earlier rule that the whole photo must fit without cropping.

## Technical details
- `src/components/store/product-card.tsx` only.
- Picture link wrapper stays `block aspect-square w-full overflow-hidden`.
- `StoreImage` in the card: change `size-full object-contain` to `size-full object-cover object-center`.
- No logic, font or colour changes. The product page and cart pictures are unchanged.
