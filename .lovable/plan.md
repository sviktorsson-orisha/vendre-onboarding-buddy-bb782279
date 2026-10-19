# Store logo in the footer

## What changes
- The store's own logo (from the store settings, with the "vendre" wordmark as a fallback) is shown in the footer on every screen size, sized like the Orisha logo in the sketches:
  - **Phone:** about 150px wide (about 56px tall at most).
  - **Tablet:** about 215px wide (about 76px tall at most).
  - **Desktop:** same size as tablet, on the left at the top of the footer, above the link columns.
- Wide and tall logos both fit inside that box without being stretched.

## Technical details
- `src/components/store/store-footer.tsx`: the logo block is moved out of the `lg:hidden` wrapper and shown on all sizes. Socials stay phone/tablet only in that block, since desktop has them in the "Follow our socials" column. The border under the block also stays phone/tablet only (`lg:border-b-0`), and desktop gets top padding (`lg:pt-10 lg:pb-0`).
- Logo image classes: `h-auto max-h-14 w-[150px] object-contain object-left md:max-h-[76px] md:w-[215px]`. The fallback wordmark uses the matching text sizes.
