## Context

The codebase uses a hexagonal architecture spread across `packages/domain` (pure types), `packages/app` (ports + use-cases + AppError), and `apps/api/src/adapters/` (Kysely/S3/auth implementations). While architecturally sound, navigating a feature requires jumping between three packages. The project has ten business modules (song, track, audio-clip, midi-clip, file, invitation, organization, user, notification, health) — each currently fragmented across all three locations.

This design consolidates them into a single `@echo/modules` package where each module is a vertical slice: domain types, port interfaces, adapter implementations, and use-cases all co-located. A companion `@echo/errors` package holds the shared error hierarchy.

## Goals / Non-Goals

**Goals:**
- All code for a feature module lives in one place
- `apps/api` becomes a pure routing/HTTP layer — no business logic, no adapter implementations
- Import paths are intuitive: `@echo/modules/song/use-cases`, `@echo/modules/song/infrastructure`, `@echo/modules/song/domain`
- Zero behavior changes — this is a structural refactoring only

**Non-Goals:**
- Adding new features or changing any business logic
- Changing the database schema
- Changing the public API surface exposed to clients
- Splitting modules into separate packages (all modules stay in one `@echo/modules` package)

## Decisions

### D1: Single package, subpath exports (not per-module packages)

All modules live inside `packages/modules` and are exposed via subpath exports in `package.json` (e.g., `@echo/modules/song/domain`).

**Alternatives considered:**
- *Separate package per module* (`@echo/song`, `@echo/track`, etc.) — rejected because it would require workspace entries, `package.json` files, and `tsconfig.json` for each module. The subpath export approach gives the same import ergonomics with far less overhead.
- *Flat module barrel exports* (`@echo/modules` with named re-exports) — rejected because it conflates all modules into one import namespace and makes tree-shaking harder.

### D2: `infrastructure` exports both ports and adapter factories from one path

`@echo/modules/song/infrastructure` exports both `SongRepoPort` (the interface) and `makeSongRepo` (the Kysely factory). Consumers that only need the type can use TypeScript's `import type`.

**Alternatives considered:**
- *Split `infrastructure/ports` and `infrastructure/adapters`* — rejected as unnecessary complexity. `apps/web` never imports infrastructure at all; `apps/api` always needs both the type (for Context) and the factory (for wiring).

### D3: `@echo/errors` as a separate lightweight package

`AppError` and its subclasses move to `packages/errors` rather than a `shared/` directory inside `packages/modules`. This keeps `@echo/modules` free of the error class definitions while allowing both `@echo/modules` (use-cases throw errors) and `apps/api/lib/errors.ts` (converts errors to TRPCError) to import from the same source.

**Alternatives considered:**
- *Embed in `packages/modules/src/shared/`* — works, but then `apps/api/lib/errors.ts` imports from `@echo/modules` just for error types, which is conceptually odd.
- *Keep in `packages/app` and don't delete it* — rejected; the goal is to eliminate `packages/app` entirely.

### D4: `notification` is a service module (no domain layer)

The notification module has no domain types — it's purely infrastructure (mailer, email templates, email notifier). Its `domain/index.ts` exports only simple payload types if needed. This is acceptable; not every module needs all three layers.

### D5: Migration order — build new before deleting old

Implement in this order:
1. Create `packages/errors` (no deps, unblocks everything)
2. Create `packages/modules` with all modules (depend on old packages during construction — import from `@echo/errors` for errors, keep existing types in domain/app temporarily if needed)
3. Update `apps/api` to import from `@echo/modules` and `@echo/errors`
4. Update `apps/web` and `apps/cli`
5. Delete `packages/domain` and `packages/app`

This avoids a "big bang" migration and allows incremental verification.

### D6: `apps/api/src/adapters/auth/` stays in api

`auth.ts` (better-auth server instance) and `route.ts` (Fastify auth route) are HTTP-layer concerns, not module infrastructure. They stay in `apps/api`. `user-permission.ts` (the `UserPermissionRepoPort` adapter) moves to `modules/src/user/infrastructure/`.

## Risks / Trade-offs

- **`@echo/modules` is a heavy package** → carries `@aws-sdk`, `nodemailer`, `kysely` etc. Any consumer gets all transitive deps. Mitigation: only `apps/api` should depend on `@echo/modules`; `apps/web` only imports `@echo/modules/user/domain` which is a type-only import — no runtime impact.

- **Cross-module imports inside `modules`** → some use-cases reference ports from other modules (e.g., `makeCreateSong` needs `OrganizationRepoPort`). These are intra-package imports (`../../organization/infrastructure`) — fine, but the dependency direction must be deliberate. Mitigation: document allowed cross-module dependency directions; never import use-cases from another module (only ports/domain).

- **Large migration scope** → touching many files across api, web, cli, and creating two new packages. Mitigation: the migration is purely mechanical (move + update imports); no logic changes. Tasks are ordered to allow verification at each step.

- **TypeScript path resolution** → subpath exports require matching entries in both `package.json` `exports` and `tsconfig.json` `paths`. Missing either causes silent resolution failures. Mitigation: verify each module's imports compile before moving to the next.

## Migration Plan

1. Create `packages/errors` — copy `errors.ts` from `packages/app`, update workspace/tsconfig
2. Create `packages/modules` scaffold — `package.json` with all subpath exports, `tsconfig.json`, workspace entry
3. For each module (song → track → audio-clip → midi-clip → file → invitation → organization → user → notification → health):
   a. Create `domain/index.ts` (copy from `packages/domain` or define inline)
   b. Create `infrastructure/index.ts` (copy port from `packages/app/src/ports/`, copy adapter from `apps/api/src/adapters/`)
   c. Create `use-cases/index.ts` (copy from `packages/app/src/use-cases/`)
4. Update `apps/api`:
   a. Replace `@echo/app` + `@echo/domain` imports in `context.ts`, `trpc.ts`, `router/**` with `@echo/modules/*/infrastructure`, `@echo/modules/*/use-cases`
   b. Replace `@echo/app/errors` with `@echo/errors` in `lib/errors.ts`
   c. Delete `apps/api/src/adapters/` directory
5. Update `apps/web`: replace `@echo/domain/user` → `@echo/modules/user/domain`
6. Update `apps/cli`: replace any `@echo/app`/`@echo/domain` imports
7. Run `pnpm typecheck` across all packages/apps — fix any resolution issues
8. Delete `packages/domain` and `packages/app`
9. Remove workspace entries and `pnpm-workspace.yaml` references for deleted packages
10. Run full `pnpm build` and `pnpm test`

**Rollback:** Git revert. No database changes, no deployed artifacts affected.

## Open Questions

- None — scope is fully defined.
