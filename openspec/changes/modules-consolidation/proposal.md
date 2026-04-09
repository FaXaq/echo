## Why

The codebase currently splits domain types, port interfaces, use-cases, and adapter implementations across four locations (`packages/domain`, `packages/app`, `apps/api/src/adapters/`, `apps/cli/src/adapters/`), making it hard to reason about a feature in one place and requiring cross-package navigation for every change. Consolidating into vertically-sliced feature modules eliminates this scatter and aligns the architecture with how the team actually thinks about the system — by feature, not by layer.

## What Changes

- **NEW** `packages/modules` (`@echo/modules`) — new package containing all feature modules, each with `domain/`, `infrastructure/` (ports + adapters), and `use-cases/` subdirectories
- **NEW** `packages/errors` (`@echo/errors`) — new lightweight package for the `AppError` hierarchy, shared between modules and the API layer
- **BREAKING** `packages/domain` removed — types and permission predicates move into the relevant module's `domain/`
- **BREAKING** `packages/app` removed — ports move into `infrastructure/`, use-cases move into `use-cases/`, `AppError` moves to `@echo/errors`
- **BREAKING** `apps/api/src/adapters/` removed — all adapter factory functions move into the corresponding module's `infrastructure/`
- `apps/api` updated — imports use-case factories from `@echo/modules/*/use-cases` and adapter factories from `@echo/modules/*/infrastructure`
- `apps/web` updated — `@echo/domain/user` import replaced with `@echo/modules/user/domain`
- `apps/cli` updated — any `@echo/app` or `@echo/domain` imports replaced with `@echo/modules/*` equivalents

## Capabilities

### New Capabilities

- `modules-package`: The `@echo/modules` package — vertically-sliced feature modules (song, track, audio-clip, midi-clip, file, invitation, organization, user, notification, health) each exposing `domain`, `infrastructure`, and `use-cases` subpath exports
- `errors-package`: The `@echo/errors` package — `AppError` class hierarchy and factory helpers, zero dependencies except `zod`

### Modified Capabilities

<!-- No spec-level behavior changes — this is a pure structural refactoring. All existing features behave identically after migration. -->

## Impact

- **`packages/domain`** — deleted
- **`packages/app`** — deleted
- **`packages/modules`** — created; depends on `@echo/db`, `@echo/auth`, `@echo/i18n`, `@echo/logger`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `nodemailer`, `zod`
- **`packages/errors`** — created; depends on `zod` only
- **`apps/api`** — `src/adapters/` deleted; `context.ts`, `trpc.ts`, `router/`, `lib/errors.ts` updated to import from `@echo/modules` and `@echo/errors`
- **`apps/web`** — one import updated (`@echo/domain/user` → `@echo/modules/user/domain`)
- **`apps/cli`** — imports from `@echo/app`/`@echo/domain` replaced with `@echo/modules/*`
- **`turbo.json` / `pnpm-workspace.yaml`** — workspace entries for new packages added, old ones removed
- No database schema changes, no API behavior changes, no UI changes
