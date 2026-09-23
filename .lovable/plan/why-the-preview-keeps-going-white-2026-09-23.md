# Why the preview keeps going white

## What I found

The site itself is healthy: the latest build is OK, there are no runtime errors, and the
page answers normally (HTTP 200 with full content) when I request it here.

The white screen comes from the dev server, not from the store code. In the server log,
a few seconds after every restart:

```text
[vite] (client) [optimizer] bundling dependencies...
[vite] (client) dependencies optimized: @tanstack/router-core, ... , seroval
[vite] (client) optimized dependencies changed. reloading
```

The dev server discovers a handful of libraries only after the page has already started
loading, re-packages them, and then forces the open tab to reload. If your tab happens to
be in the middle of starting up when that forced reload lands, it ends up blank and stays
blank until you reload by hand. That is exactly the pattern you have been seeing: it
happens right after a restart, a hard reload fixes it, and one tab is white while another
is fine.

## The fix

Declare those libraries up front so the dev server packages them during startup instead of
discovering them mid-page-load. No forced reload, no white tab.

## Technical detail

In `vite.config.ts`, add a `vite.optimizeDeps.include` list covering the deps currently
reported in the "dependencies optimized" line plus their close relatives, so the
pre-bundling pass is complete before the first request is served:

- `@tanstack/router-core`
- `@tanstack/router-core/isServer`
- `@tanstack/router-core/ssr/client`
- `seroval`

The config keeps using `defineConfig` from `@lovable.dev/vite-tanstack-config` and only
adds the extra `vite` section — no plugins are added or changed.

## Verification

1. Restart the dev server and read its log: the "optimized dependencies changed. reloading"
   line must be gone.
2. Load the storefront and confirm it renders with no forced reload and no console errors.
3. Confirm the build still passes.

If a white tab ever shows up again after this, it is a stale tab rather than a rebuild, and
a hard reload (Cmd/Ctrl + Shift + R) clears it.
