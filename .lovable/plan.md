# Square product cards, round social icons

## Change
- `src/components/store/product-card.tsx`: add `rounded-none` to the product card so it is square on every screen size. The shared card style used elsewhere (setup guide, front-page box) is not changed.
- Social icons in the footer already use full rounding (`rounded-full`), which does not depend on the global radius. They stay round, no change needed.

## Check
- Screenshot of a product grid and the footer at phone and desktop width.
