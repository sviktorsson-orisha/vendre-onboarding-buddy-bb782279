# Reusable feedback message for forms

## What changes
- A new reusable **message box** with three types: success, error and warning. It always looks the same:
  - Full width, centered bold small text, soft corners as in the sketch (follows the global corner setting).
  - Text in the global Success / Alert / Warning colour, background a light tint of the same colour (about 12%).
  - Warning uses darker text on the light yellow tint so it stays readable.
- **Edit account (Redigera konto):** after saving,
  - success shows a green message "Dina uppgifter har sparats" / "Your details have been saved" (the existing saved text),
  - failure shows a red message with the store's error text.
  - The message appears above the Save button, replacing today's small grey "saved" text and plain red error line. It disappears again when you start editing a field.
- Small red texts under single fields (e.g. "required") stay as they are.
- Other forms on My account can use the same box later; only Edit account has a form with save feedback today.

## Technical details
- New `src/components/store/form-message.tsx`: `<FormMessage variant="success" | "error" | "warning">`, `role="status"` (success/warning) or `role="alert"` (error). Classes: `bg-success/12 text-success`, `bg-alert/12 text-alert`, `bg-warning/25 text-foreground`; `rounded-lg px-4 py-3 text-center text-sm font-semibold`.
- `src/pages/AccountPage.tsx`: replace the `error` paragraph and the `saved` span with `FormMessage`. Existing state and save logic unchanged.
- No logic changes.
