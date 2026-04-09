## 1. Database & Auth Layer

- [x] 1.1 Add `theme` field to `userAdditionalFields` in `packages/auth/src/additional-fields.ts` (type: string, defaultValue: "system", input: true)
- [x] 1.2 Create Kysely migration `packages/db/migrations/<timestamp>_add-user-theme.ts` adding `theme VARCHAR NOT NULL DEFAULT 'system'` to `user` table
- [x] 1.3 Update `packages/db/src/schema.d.ts` — add `theme: Generated<string>` to the `User` interface

## 2. ThemeProvider

- [x] 2.1 Add optional `serverTheme?: "light" | "dark" | "system"` prop to `ThemeProvider` in `apps/web/src/contexts/theme.tsx`
- [x] 2.2 Update `useState` initializer to use `serverTheme` first, then localStorage, then `defaultTheme`

## 3. Root Layout Integration

- [x] 3.1 In `apps/web/src/routes/__root.tsx`, call `i18next.changeLanguage(session.user.locale)` when session is present (in `RootContent` or `RootLayout` after session loads)
- [x] 3.2 Pass `session?.user.theme` as `serverTheme` prop to `<ThemeProvider>` in `RootLayout`

## 4. UserMenu Controls

- [x] 4.1 Add theme toggle to `apps/web/src/components/user-menu.tsx`: three-option toggle (Light / System / Dark) using lucide icons (Sun / Monitor / Moon), reads current theme from `useTheme()`
- [x] 4.2 Add language switcher to `user-menu.tsx`: two buttons (EN / FR), reads current language from `i18next.language`
- [x] 4.3 Wire theme toggle: on change call `setTheme(newTheme)` then `authClient.updateUser({ theme: newTheme })` (no await) then `router.invalidate()`
- [x] 4.4 Wire language switcher: on change call `i18next.changeLanguage(lang)` then `authClient.updateUser({ locale: lang })` (no await) then `router.invalidate()`
- [x] 4.5 Add i18n translation keys for any new user-visible strings in the menu (theme label, language label)
