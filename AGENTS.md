# AGENTS.md

This file tells AI agents how to work in this repo.

## Project

Echo helps musicians organize their music and creation process:

- For individual users: organize personal resources (tracks, files, ideas) tied to their creative process.
- For bands/organizations: handle the organizational side (planning, drive/file storage, money, tasks) alongside the creation process.

## Development principles

- Be concise. Write code that is easy to understand and maintain — keep it simple.
- Do not write comments unless necessary.
- The gate at the end of development should be green. Don't validate at each step — validate once at the end with `pnpm validate`.
- Don't annotate function/variable return types where TypeScript can infer them — let inference do the work. Only annotate when inference is insufficient, ambiguous, or the signature is a public package boundary that benefits from an explicit contract. Example: ports (e.g. `CreateOrganizationCommandPort`) should be typed — they're the contract between layers, not an implementation detail.

## Banned

- TypeScript `as` type assertions, in source and test code. Prefer proper typing instead: typed factories/helpers, type guards, or the library's own inferred types. For example, better-auth hook payloads are typed as `T & Record<string, any>`, so additional fields are already accessible without a cast (e.g. `organization.isPersonal`).

## Translations

- UI strings (`apps/web/src`): mark with Lingui macros (`Trans`, `t`, `msg`), then run `pnpm i18n:extract` to add them to `packages/i18n/locales/{locale}/messages.po`, fill in `msgstr` for `fr` by hand, then `pnpm i18n:compile`. In JSX, prefer `<Trans>` over `t`\`...\` — reserve `t` for strings needed outside JSX (attributes, variables, non-component code).
- Email strings (`packages/i18n/src/email-messages.ts`): not macro-based — that file runs in `apps/api` (tsx, no macro transform) and can't use Lingui macros. Add the descriptor to `emailMessages` and its French string to `emailTranslationsFr` by hand.
- No auto-translation is configured; all `msgstr`/`emailTranslationsFr` values must be written manually.
