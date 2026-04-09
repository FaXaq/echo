## Why

Users have no way to control their UI theme or language from within the app — theme is hardcoded to dark mode and language is inferred from the browser. Preferences should be explicit, persistent across devices, and stored in the user's account.

## What Changes

- Add a `theme` field (`"light" | "dark" | "system"`) to the user record in the DB and auth layer
- Add a theme toggle control in the user menu (light / dark / system options)
- Add a language switcher control in the user menu (EN / FR)
- Both preferences update the backend immediately (optimistic — no loading state shown) and invalidate the router session after
- On app load, the session-stored locale initializes i18next and the session-stored theme initializes the ThemeProvider, making preferences consistent across devices

## Capabilities

### New Capabilities

- `user-preferences`: Per-user storage and UI controls for theme and language preferences, with optimistic backend sync via `authClient.updateUser()`

### Modified Capabilities

<!-- none -->

## Impact

- `packages/auth/src/additional-fields.ts` — add `theme` field
- `packages/db/migrations/` — new migration adding `theme` column to `user` table
- `packages/db/src/schema.d.ts` — regenerated to include `theme` on `User`
- `apps/web/src/contexts/theme.tsx` — accept `serverTheme` prop to seed from session
- `apps/web/src/routes/__root.tsx` — sync locale and theme from session on load; invalidate router after preference update
- `apps/web/src/components/user-menu.tsx` — add theme toggle and language switcher with optimistic `authClient.updateUser()` calls
