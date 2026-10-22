# Global colours for success, alert and warning

## What changes
- Three new global colours in the style file, each with a matching text colour for use on top of it:
  - **Success** #06B576 (white text on top)
  - **Alert** #F42C04 (white text on top)
  - **Warning** #F5DD3D (black text on top, white would be unreadable on yellow)
- The existing "destructive" (error red) colour points at Alert, so every error text and red button in the store uses the new red automatically.
- Applied in the store today:
  - Product page stock status: "In stock" uses Success, "Out of stock" uses Alert (replaces the hardcoded green).
  - Form error messages (login, register, my account, search) use Alert via the destructive link.
  - Notifications (pop-up toasts) get success/error/warning styling from the same colours.
- Usable later anywhere with simple names: `bg-success`, `text-success`, `bg-alert`, `bg-warning`, `text-warning-foreground` etc.
- Setup guide stays untouched (as agreed earlier), unless you want it included.

## Note on text colours
Earlier we agreed text should only be black or grey. Stock status and error messages are an exception here because the colour carries meaning. Say so if you'd rather keep those texts black/grey and use the colours only as backgrounds (e.g. a small coloured dot or badge).

## Technical details
- `src/styles.css` `:root` and `.dark`: add `--success`, `--success-foreground`, `--alert`, `--alert-foreground`, `--warning`, `--warning-foreground` in oklch (converted from the hex values); set `--destructive: var(--alert)` and `--destructive-foreground: var(--alert-foreground)`. Register `--color-success*`, `--color-alert*`, `--color-warning*` in `@theme inline`.
- `src/pages/ProductPage.tsx`: `text-emerald-700` -> `text-success`, `text-destructive` stays (now Alert).
- `src/components/ui/sonner.tsx`: map success/error/warning toast classes to the new tokens.
- No logic changes.
