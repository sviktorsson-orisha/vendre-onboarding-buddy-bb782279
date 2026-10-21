# Footer top border

The footer gets a thin line along its top edge, in the same colour and thickness as the line under the header. It shows on every screen size.

## Technical details
- `src/components/store/store-footer.tsx` line 86: `<footer className="bg-card">` -> `<footer className="border-t border-border bg-card">`.
