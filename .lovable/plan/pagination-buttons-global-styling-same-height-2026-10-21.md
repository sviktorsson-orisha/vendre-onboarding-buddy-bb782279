# Pagination buttons: global styling, same height

On the category page, the "Previous", page number and "Next" buttons all get the same height and keep using the store's shared button settings (colours, corners, no capital letters). The current page stays filled and the other buttons stay outlined. How the buttons work stays the same.

## Technical details
- `src/components/store/pagination.tsx` only.
- Prev/Next: add `h-9 py-0` to `brand-button-ghost` so they match the 36px number buttons (right now their padding makes them a different height).
- Number buttons: keep `size-9 px-0`, and add `py-0` so the filled `brand-button` (0.7rem padding) can't end up taller than the outlined ones.
- No changes to colours, fonts or logic. Both classes already read the global `--button-*` tokens.
