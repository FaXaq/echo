## Context

The app already has partial infrastructure for both preferences:
- **Theme**: `ThemeProvider` (contexts/theme.tsx) supports light/dark/system and persists to localStorage. The `.dark` CSS class with full token overrides exists in `index.css`. `defaultTheme="dark"` is hardcoded in `__root.tsx`.
- **Locale**: `locale` column already exists on `user` (via `userAdditionalFields` in `packages/auth`). `i18next` with `LanguageDetector` is configured. `en.json` and `fr.json` exist in `@echo/i18n`.

The gap is: no UI controls exist to change either preference, and neither is read from the DB on load — so they don't persist across devices.

## Goals / Non-Goals

**Goals:**
- Store theme and locale preferences in the user's DB record
- Sync both to the backend on change (optimistic — no loading states)
- Initialize theme and locale from session on app load (cross-device consistency)
- Expose controls in the UserMenu dropdown

**Non-Goals:**
- Settings page (UserMenu controls are sufficient)
- Additional languages beyond EN/FR
- Per-organization preferences (user-level only)
- Toast/error feedback on failed sync (silent fire-and-forget)

## Decisions

### 1. `authClient.updateUser()` instead of a tRPC mutation

better-auth exposes `updateUser()` on the client which hits the better-auth REST endpoint and updates `additionalFields` directly. This avoids writing a new tRPC procedure, use-case, and port for a simple field update.

**Alternative considered**: Custom `authedProcedure` tRPC mutation `user.updatePreferences`. Rejected — unnecessary boilerplate when better-auth already provides this capability.

### 2. Optimistic updates with `router.invalidate()` after

Local state (ThemeProvider + i18next) updates immediately. `authClient.updateUser()` fires without `await`. After it resolves, `router.invalidate()` refreshes the session in the router context so the new value is reflected if the user navigates or the session is re-read.

**Alternative considered**: No invalidation (rely solely on local state). Rejected — the session in router context would be stale, causing the preference to revert on next session refresh.

**Alternative considered**: Await the update before applying locally. Rejected — introduces latency on every toggle.

### 3. `theme` added as a better-auth `additionalField`

The `locale` field is already implemented this way. Adding `theme` follows the same pattern: `userAdditionalFields` in `packages/auth/src/additional-fields.ts` + a Kysely migration + schema regeneration.

**Alternative considered**: Store theme in a separate `user_preferences` table. Rejected — over-engineered for two scalar fields.

### 4. Session seeds ThemeProvider via `serverTheme` prop

`ThemeProvider` gains a `serverTheme?: Theme` prop. When provided, it takes precedence over localStorage at mount time. This ensures the DB value wins after login without a flash.

**Alternative considered**: Call `localStorage.setItem()` in the root before mounting `ThemeProvider`. Rejected — imperative localStorage mutation in render is fragile.

### 5. `i18next.changeLanguage()` called in root when session loads

`__root.tsx` calls `i18next.changeLanguage(session.user.locale)` when the session is present. `LanguageDetector` remains as the fallback for unauthenticated pages.

## Risks / Trade-offs

- **Stale session window**: Between the `updateUser` call and `router.invalidate()` resolving, the in-memory session still has the old value. This is acceptable — local state drives the UI and the window is milliseconds.
- **`router.invalidate()` triggers a re-render**: All route loaders re-run. This is the intended behavior for session refresh and is the existing pattern (e.g., after logout). For a preference toggle it's a minor cost.
- **schema.d.ts is generated**: After adding the migration, `kysely-codegen` must be re-run (or `schema.d.ts` edited manually) to add `theme` to the `User` interface. If missed, TypeScript will not surface the field in DB queries.

## Migration Plan

1. Add `theme` to `userAdditionalFields` (auth package)
2. Add Kysely migration: `ALTER TABLE "user" ADD COLUMN "theme" VARCHAR NOT NULL DEFAULT 'system'`
3. Regenerate `schema.d.ts` via `kysely-codegen` or manual edit
4. Implement frontend changes
5. Deploy — no data backfill needed (DEFAULT 'system' covers existing rows)

## Open Questions

- None. All decisions made during exploration.
