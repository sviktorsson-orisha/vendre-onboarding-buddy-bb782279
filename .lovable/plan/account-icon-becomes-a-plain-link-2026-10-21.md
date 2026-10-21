# Account icon becomes a plain link

## What changes
- Clicking the person icon in the header no longer opens a menu.
- Signed in: it takes you straight to My account (the Overview page).
- Not signed in: it takes you to the sign in / register page (unchanged).
- Signing out is still possible from inside My account.

## Technical details
- `src/components/store/account-menu.tsx`: remove the DropdownMenu; render a single `<Link>` with the same icon styling, `to="/mitt-konto"` when authenticated, otherwise `/logga-in`. Aria label switches between `account.title` and `account.signIn`. Drop unused imports (dropdown, logout, navigate, extra icons).
- Before building, confirm `AccountPage` already offers a sign-out action; if not, keep sign-out available there.
