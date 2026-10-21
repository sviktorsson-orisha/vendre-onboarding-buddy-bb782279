# Wider category description

The category description text on the category page gets more room on tablet and desktop. It now runs up to about 900px wide instead of about 670px, so long texts take fewer lines, like in the sketch. Phones are unchanged: the text still uses the full width and the "Läs mer" link stays.

## Technical details
- `src/pages/CategoryPage.tsx` line 136: `max-w-2xl` -> `max-w-4xl`. No other changes.
