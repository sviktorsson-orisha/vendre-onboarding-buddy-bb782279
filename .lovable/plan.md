# Buttons without capital letters

Button text shows exactly as written (for example "Lägg i kundvagn" instead of "LÄGG I KUNDVAGN"). This covers every button in the store, both the filled and the outlined ones. Small labels that aren't buttons, such as filter headings and table headings, stay as they are.

## Technical details
- `src/styles.css`: add a `--button-text-transform: none;` token next to the other `--button-*` tokens in `:root`, so this stays controlled from the same place.
- In `@utility brand-button` and `@utility brand-button-ghost`, replace `text-transform: uppercase;` with `text-transform: var(--button-text-transform);`.
- `brand-eyebrow` (small labels, not buttons) is left unchanged.
- The shared `Button` component already uses normal casing; it gets `[text-transform:var(--button-text-transform)]` so it follows the same token.
- No logic changes.
