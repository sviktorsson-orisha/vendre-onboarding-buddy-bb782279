# Store language follows the session

## What changes
- The storefront's own text (header, product pages, cart, account, login, footer and so on) uses the language the store session reports. Right now that's English (`en`). If the session reports Swedish (`sv`), the store shows Swedish.
- If the session reports a language we don't have text for yet, the store falls back to Swedish.
- In demo mode (no store connected), the store stays in Swedish, as it is now.
- The setup guide and its top banner keep their own picker (SV/EN). What you pick there changes only the guide, not the store.
- No switching between Vendre languages yet. That comes with the fuller language support later.

## Technical details
- `src/lib/i18n.tsx`: split into two languages.
  - `storeLanguage`: set from the session's `language.code` (only "sv"/"en" are accepted, otherwise "sv"). It is not saved in localStorage and sets `document.documentElement.lang`.
  - `guideLanguage`: the existing localStorage-backed value, still changed by `LanguagePicker`.
  - `useI18n()` returns the store language by default. A small `GuideLanguageScope` context makes `useI18n()` return the guide language inside it.
- A `useSessionLanguageSync()` in the store shell reads `useSessionContext().language?.code` and calls `setStoreLanguage`.
- Wrap `SetupWizardDialog` content and the `SetupNoticeBar` in `GuideLanguageScope`.
- No changes to the API calls: the session language already controls the product and category data the store sends back.
