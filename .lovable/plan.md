# Square corners by default

Set the base corner rounding to 0 so buttons, fields, cards and panels are square across the store.

## Change
- In `src/styles.css`, inside `:root`, change `--radius: 0.5rem;` to `--radius: 0rem;`.
- Nothing else in the file changes (`@theme inline`, `@layer base`, `@utility` blocks stay as they are).

## Technical details
- `--radius-sm` and `--radius-md` are calculated as `--radius` minus 4px/2px. With `--radius: 0` they become negative, and browsers treat a negative border-radius as invalid. Those tokens are defined in `@theme inline`, which stays untouched, so instead of editing them the `--radius` value stays 0. Elements using `rounded-sm`/`rounded-md` then fall back to square corners, which matches the request.
- `--radius-xl` and larger add pixels on top of `--radius` (for example 0 + 4px). Those classes stay slightly rounded unless they are changed too.
- `rounded-full` items (icon circles, badges) stay round. They don't use this variable.
- Check: screenshot of the header, a product card and the footer at desktop width.
