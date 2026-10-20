# Even footer columns regardless of page-menu count (desktop)

## Problem
The desktop footer always uses a fixed 5-column grid and pins "Follow our socials" to column 5. With only 3 page menus, column 4 stays empty and creates a gap.

## Change
In the desktop footer (`src/components/store/store-footer.tsx`):
- Make the number of grid columns follow the number of page menus shown (max 4) plus one column for socials, e.g. 3 menus → 4 even columns, 2 menus → 3 even columns.
- Remove the fixed "column 5" placement so the socials column sits directly after the last page menu.
- Phone and tablet accordions are unchanged.

## Technical details
- `const visible = groups.slice(0, 4)`; pick the class from a static map so Tailwind keeps them: `{1:"lg:grid-cols-2",2:"lg:grid-cols-3",3:"lg:grid-cols-4",4:"lg:grid-cols-5"}[visible.length] ?? "lg:grid-cols-1"`.
- Drop `col-start-5` from the socials column.
