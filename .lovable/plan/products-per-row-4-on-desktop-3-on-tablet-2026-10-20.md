# Products per row: 4 on desktop, 3 on tablet

Apply the same product grid on every product list (front page featured, category page, search results, and the loading placeholders):

- Phone (under 640px): 1 per row (unchanged)
- Small phones in landscape (640–767px): 2 per row (unchanged)
- Tablet (768px+): 3 per row
- Desktop (1024px+): 4 per row

On the category page the filter column sits beside the products on desktop; with the wider content area 4 cards still fit.

## Technical details
Replace `sm:grid-cols-2 lg:grid-cols-3/4` with `sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` in:
- src/pages/Index.tsx (line 32)
- src/pages/CategoryPage.tsx (lines 110 skeleton, 205 product list)
- src/pages/SearchPage.tsx (line 51)
