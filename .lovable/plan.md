# Footer logo same size as header logo

On phone and tablet the footer logo is currently much bigger than the logo in the header. Make it match the header exactly.

## Change
- Footer logo image: same height and max width as the header logo (phone: small, tablet: slightly larger).
- Fallback "vendre" wordmark (shown when the store has no logo): same text size as in the header.
- Nothing else in the footer changes.

## Technical details
- `src/components/store/store-footer.tsx`: image classes `h-12 max-w-[200px] md:h-16` become `h-7 max-w-[130px] md:h-8 md:max-w-[150px]` (keep `w-auto self-start object-contain`). Wordmark `text-3xl md:text-4xl` becomes `text-xl md:text-2xl`.
- Desktop footer shows no logo, so no `lg:` sizes are needed.
- Check with screenshots at 390 and 768 px widths.
