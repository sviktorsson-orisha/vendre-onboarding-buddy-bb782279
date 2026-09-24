# Consistent pointer cursor on everything clickable

## What changes
Everything you can click (buttons, links, dropdowns, checkboxes, radio buttons, switches, tabs, accordion headers, menu items, labels tied to inputs, file/color pickers) shows the hand cursor. Disabled items keep the "not allowed" cursor.

## Technical details
Add one global rule in the `@layer base` block of `src/styles.css`:

```css
button, [role="button"], a[href], select, summary, label[for],
input[type="checkbox"], input[type="radio"], input[type="submit"],
input[type="button"], input[type="reset"], input[type="file"], input[type="color"],
[role="tab"], [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"],
[role="option"], [role="switch"], [role="checkbox"], [role="radio"],
[data-radix-collection-item] { cursor: pointer; }

:is(button, [role="button"], select, input, [role="menuitem"], [role="option"], [role="tab"]):disabled,
[aria-disabled="true"], [data-disabled] { cursor: not-allowed; }
```

No component or logic changes. Verify visually in the preview afterwards.
