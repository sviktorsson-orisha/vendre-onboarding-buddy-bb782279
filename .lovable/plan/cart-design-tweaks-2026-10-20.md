# Cart design tweaks

Changes in the cart panel only (no logic changes).

1. **Remove button** becomes just the trash can icon: no text, no border, no background. Kept at the right edge of the row, with an accessible label ("Remove") for screen readers.
2. **Plus and minus buttons** lose their borders; they stay icon-only and clickable with a light hover tint.
3. **Separator lines** between cart items, using the global border color. The line goes between items only, not above the first or below the last.

## Technical details
- File: `src/components/store/cart-sheet.tsx`.
- Quantity and remove buttons: replace `brand-button-ghost` with plain button classes (`inline-flex size-7 items-center justify-center text-primary hover:bg-accent`, no border).
- Remove button: drop the `{t("store.remove")}` text, add `aria-label={t("store.remove")}`, keep `Trash2` icon and `ml-auto`.
- List: `ul` becomes `divide-y divide-border`, each `li` gets `py-4` (first/last padding adjusted) instead of `space-y-4`.
