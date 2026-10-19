# Remove bottom line under last footer accordion

On phone and tablet, the last folding link group in the footer should have no line underneath, as in the Figma sketch. The other groups keep their lines.

## Technical details
- `src/components/store/store-footer.tsx`: add `last:border-b-0` to the `AccordionItem` className.
