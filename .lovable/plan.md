# Make the desktop content area wider

## What changes
- On desktop, the store content, header, footer and setup banner grow from about 1150px to about 1400px wide, so pages use more of the screen. Phone and tablet stay the same. Everything still lines up on the same edge.

## Technical details
- Replace `max-w-6xl` (72rem) with `max-w-6xl xl:max-w-[88rem]` in all store containers: `store-shell.tsx`, `store-header.tsx` (lines 37, 179, 185, 236, 245), `store-footer.tsx` (87, 143), `setup-notice-bar.tsx` (64, 81).
