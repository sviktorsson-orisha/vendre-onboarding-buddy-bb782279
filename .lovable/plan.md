# Language picker only in the setup guide

## Answer: store language in the session
Yes. The store session reports its language. Right now it is **English** (`language: { id: 5, code: "en" }`), with currency SEK. This can later decide the storefront language once the language link to Vendre is built.

## Changes
- Remove the language picker from the store header, both the desktop header and the slide-in menu (including its "Språk" label).
- Add the language picker at the top of the setup guide window, so the guide can still be switched between Swedish and English.
- The storefront keeps using its current language, so visitors see no change beyond the missing picker.
- No connection to Vendre's languages yet. That comes later.

## Technical details
- `src/components/store/store-header.tsx`: drop the `LanguagePicker` import and both render sites (hidden lg block + mobile Sheet footer).
- `src/components/vendre/setup-wizard.tsx`: render `<LanguagePicker />` in the dialog's top-right area (next to the close button, with right padding so they don't overlap).
- `brand-shell.tsx` is unused; leave it as is.
