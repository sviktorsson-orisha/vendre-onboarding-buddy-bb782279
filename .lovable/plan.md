# Remove hover effect on cart plus/minus buttons

The plus and minus buttons in the cart no longer change background when hovered. They stay black icons, clickable as before.

## Technical details
In `src/components/store/cart-sheet.tsx`, remove `transition-colors hover:bg-accent` from both quantity buttons (lines 127 and 138).
