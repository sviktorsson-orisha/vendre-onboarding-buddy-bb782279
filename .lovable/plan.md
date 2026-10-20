# Remove the heart icon from the header

## What changes
- The heart (favorites) icon disappears from the header on phone, tablet and desktop. The account and cart icons move over to fill the gap at the right edge.

## Technical details
- `src/components/store/store-header.tsx`: delete the element wrapping `<Heart />` (around line 215) and drop `Heart` from the lucide-react import.
