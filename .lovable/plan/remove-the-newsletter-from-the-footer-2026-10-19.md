# Remove the newsletter from the footer

## What changes
- **All sizes:** remove the newsletter heading, the short text and the email field with its send button.
- **Phone and tablet:** the logo and social icons stay at the top of the footer, with the line under them, followed by the folding link groups.
- **Desktop:** the whole newsletter row goes away, including the line under it. The footer starts directly with the link columns and "Follow our socials".

## Technical details
- `src/components/store/store-footer.tsx`: delete the heading, text and form. The top block becomes phone/tablet only (`lg:hidden`) and keeps its bottom border. The `Send` icon import is removed.
- The newsletter text entries in `src/lib/i18n.tsx` (`store.newsletterTitle`, `store.newsletterText`, `store.emailPlaceholder`, `store.subscribe`) are removed, since nothing uses them anymore.
