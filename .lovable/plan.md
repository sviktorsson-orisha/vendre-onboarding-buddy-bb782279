# Product box pictures: uniform squares

Every product picture sits in a square of the same size, and the whole photo fits inside it without being stretched or cropped. Any space around a tall or wide photo is white, the same as the product box.

Note: the boxes in your screenshot are already squares, and the photos are already uncropped. What looks uneven is the photos themselves. The watch photo has its own grey background and the dress photo has a light grey one, so they show up as grey bands inside the white square. The store can't remove a background that is part of the photo. This change makes the square explicit and keeps the space around photos white. To make the grid look fully even, the photos need white or transparent backgrounds in Vendre.

## Technical details
- `src/components/store/product-card.tsx` only.
- Picture link wrapper: `block aspect-square w-full overflow-hidden bg-card`.
- `StoreImage` in the card: `aspect-square size-full object-contain bg-transparent`, so the wrapper's card colour shows through.
- No logic, font or colour token changes.
