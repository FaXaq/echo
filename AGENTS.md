# AGENTS.md

This file tells AI agents how to work in this monorepo using DDD, hexagonal architecture, and a mostly functional TypeScript style.

---

## Project overview

Tech stack:

- Monorepo: **Turborepo**
- Backend:
  - **Node** API with **Fastify** as the base web server
  - **tRPC** for the API layer
  - **Vite** for tooling/bundling where applicable
  - **Vitest** for tests
  - **PostgreSQL** as the database
  - **Kysely** for database access and migrations
  - **better-auth** for authentication (with admin plugin)
- CLI:
  - **Commander** for the administration CLI
- Frontend:
  - **React**
  - **Tailwind CSS v4** + **shadcn/ui** for UI components
  - **TanStack Router** for routing
  - **Vite**
  - **Vitest**

Architectural goals:

- Domain-centered design (DDD).
- Hexagonal / Ports & Adapters around the domain.
- Functional core, effectful edges.

---

## Monorepo structure

- `/apps/web` – React frontend, TanStack Router, consumes tRPC client.
- `/apps/api` – Node backend, Fastify server hosting the tRPC router/HTTP endpoints.
- `/apps/cli` – Administration CLI for user management. Uses **Commander** for subcommands. Never deployed alongside web/api.
- `/packages/auth` – Auth configuration: `makeServerAuth` and `makeClientAuth` factories, better-auth plugin setup (admin + organization RBAC), permission definitions, and generated auth schema. Single source of truth for all authentication concerns.
- `/packages/db` – Shared database package: Kysely `Database` interface, migrations, and `makeDbAdapter` factory. Single source of truth for all DB schema and migration concerns.
- `/packages/modules` – Business modules (DDD + functional). Each module under `src/<name>/` has its own `domain/` (pure model), `app/` (use cases, one file per use case), and `infrastructure/` (port + adapter, one pair of files per repository/service).
- `/packages/config` – Shared TS/ESLint/Vite/Turbo config, etc.

Agents must respect this layering: **web → app → domain**, and adapters in `apps/api` depend on ports defined in `packages/modules/src/<name>/infrastructure`, never the other way.

---

## Architecture: DDD + hexagonal

### Domain layer (`packages/modules/src/<name>/domain`)

- Implement **pure** business logic (aggregates, value objects, domain services) as immutable types and functions, no framework imports.
- Use TypeScript type aliases / interfaces and tagged unions (ADTs), not classes, unless there is a strong reason.

Rules for agents:

- Do not import Fastify, tRPC, PostgreSQL client/ORM, or any web framework code here.
- Domain functions must be deterministic and side-effect free.
- Expose only domain types and pure functions (e.g. `createUser`, `changePlan`, `calculateInvoice`).

### Application layer (`packages/modules/src/<name>/app`)

- Contains **use cases**, one per file, named after the use case (e.g. `create-track.ts` exports `createTrack`). A barrel `app/index.ts` re-exports every use case.
- Use cases are plain async functions — not curried factories: `export async function createTrack(deps, input) { ... }`.
- `deps` always includes `db: KyselyDB` alongside the repo ports the use case needs; `input` is the use-case's own parameters.
- Ports are defined in the module's `infrastructure/*.port.ts` files. Every port method that touches the database takes `db: KyselyDB` as its first parameter — repo factories (`makeXRepo()`) hold no `db` reference themselves, so the same repo instance can be called with either the ambient connection or an open transaction.
- To make multiple repository calls atomic, a use case opens a transaction and passes the transaction handle into each port call instead of `deps.db`:

```ts
export async function someUseCase(
  deps: { db: KyselyDB; repoA: APort; repoB: BPort },
  input: Input,
) {
  return deps.db.transaction().execute(async (trx) => {
    await deps.repoA.method(trx, ...);
    await deps.repoB.method(trx, ...);
  });
}
```

Rules for agents:

- Define all external dependencies as **ports** (interfaces or function types) in `infrastructure/*.port.ts`.
- Never reference concrete Fastify routes, PostgreSQL drivers/ORMs, or tRPC server details here.
- Prefer factories (`makeXRepo(nonDbDeps)`) instead of classes for adapters; wiring is done at the edges (`apps/api/src/context.ts` and the tRPC router).
- Only wrap multiple port calls in `db.transaction()` when the use case genuinely needs cross-repository atomicity — a single repo call needs no explicit transaction.


### Auth layer (`/packages/auth`)

- **Single source of truth** for all authentication and authorization concerns.
- Exports:
    - `makeServerAuth(config)` — creates a better-auth server instance with admin and organization plugins.
    - `makeClientAuth(config)` — creates the better-auth client.
    - `SystemRole`, `OrganizationRole`, `systemRoleSchema`, `organizationRoleSchema` — role types and validators.
    - `ServerAuth`, `ServerSession`, `ClientSession` and other auth types.
- Permission definitions live in `packages/auth/src/plugins/admin/permissions.ts` and `packages/auth/src/plugins/organization/permissions.ts`.
Rules for agents:

- Do not import Fastify, tRPC, or any web framework code here.
- `apps/api` imports `makeServerAuth` from `@echo/auth`, not directly from `better-auth`.

### Database layer (`/packages/db`)

- **Single source of truth** for all DB schema (Kysely `Database` interface), migrations, and connection.
- Exports:
    - `makeDbAdapter(config)` — creates a Kysely DB instance + pg `Pool`.
    - `type KyselyDB` — the typed Kysely instance.
    - `makeDbMigrator(config)` — runs Kysely file-based migrations from `packages/db/migrations/`.
- Migrations live in `packages/db/migrations/`. Run `pnpm --filter @echo/db migrate`.

Rules for agents:

- All table type definitions go in `packages/db/src/types.ts`, never in `apps/api` or `apps/cli`.
- `apps/api` and `apps/cli` import `makeDbAdapter` from `@echo/db`.
- Do not import Fastify, tRPC, or any web framework code here.

### Adapters \& API (`/apps/api`)

- Hosts concrete adapters that implement ports (queues, third-party APIs) and the tRPC router + Fastify server.
- Composition root: wire ports → use case factories → tRPC procedures → Fastify routes.
- DB and auth are obtained via `@echo/db` factories, not created locally.

Typical responsibilities:

- Fastify plugin/bootstrap that:
    - Creates the Fastify server.
    - Attaches the tRPC Fastify adapter.
    - Configures middleware (logging, CORS, etc.).
- Persistence adapters:
    - Implement repository ports against PostgreSQL (e.g. `PostgresUserRepo`).
    - Use `@echo/db` for schema and DB access.

Rules for agents:

- Implement each port in its own adapter module (e.g. `PostgresUserRepo` for `UserRepoPort`).
- Keep adapters thin; they translate between external representations and domain types.
- No domain logic in adapters, tRPC handlers, or Fastify route handlers.
- Use Kysely query builder for all DB access; import `KyselyDB` type from `@echo/db`.
- Import `makeServerAuth` from `@echo/auth`, not directly from `better-auth`.

### CLI (`/apps/cli`)

- Administration CLI for user management.
- Uses **Commander** for subcommand routing.
- Authenticates as an admin user on startup via `CLI_ADMIN_EMAIL` / `CLI_ADMIN_PASSWORD` env vars.

Commands:

- `user` — create, list, get, update, delete, set-role, ban, unban.
- `session` — list, revoke.

Rules for agents:

- Destructive commands (`delete`, `ban`, `set-role`) must require a `--confirm` flag.
- Admin credentials come from env vars, never from CLI flags (prevents shell history leakage).
- DB connections must be cleaned up (`pool.end()`) after each command.
- This app is a **separate deployment artifact** — never include it in API/web Docker images.


### UI layer (`/apps/web/src/ui`)

- Co-located UI component library within the web app, built on **Tailwind CSS v4** and **shadcn/ui** patterns.
- All shared components are exported from `src/ui/index.ts` and imported via the `@/ui` path alias.
- CSS design tokens live in `src/index.css` via `@theme {}` (Tailwind v4). No separate theme file.

Components are organized into two categories:

All components live under `src/ui/components/<ComponentName>/` with co-located files:

- **Atoms** — Small, isolated, single-responsibility UI primitives (buttons, inputs, badges, etc.). Atoms must not import other atoms.
- **Composites** — Presentational components that group atoms together. Composites may import atoms but must remain purely presentational — no data fetching, no routing, no business logic.

Rules for agents:

- Every component (atom or composite) **must** have a co-located Storybook file (`*.stories.tsx`).
- Design tokens go in `src/index.css` via Tailwind v4 `@theme {}`. Do not hard-code token values in component styles.
- Components here are presentational only — data fetching, routing, and state management belong in the rest of `apps/web`.
- Do not import from `packages/domain` or `packages/app` inside `src/ui/`.
- Tailwind CSS is imported once at the app root (`src/index.css`), not inside individual components.

### Frontend (`/apps/web`)

- React app using TanStack Router for routing, the shared tRPC client for data, and `@/ui` for components.
- Components talk to **use cases** via tRPC, never directly to DB or other services.
- Tailwind CSS is imported at the app root via `src/index.css`.

Rules for agents:

- Use TanStack Router for all routing; do not use React Router or ad-hoc routing.
- React components should call tRPC hooks / client functions, not construct raw HTTP calls where avoidable.
- **Never import directly from `@mantine/*` or any third-party component library inside `apps/web`.** All UI components must be exported from `src/ui/index.ts` and imported via `@/ui`.
- Keep domain logic in the backend; frontend should mainly handle view state and UX.
- **All forms must use `react-hook-form` with `zodResolver` from `@hookform/resolvers/zod`.** Define a `zod` schema for every form, infer field types with `z.infer<>`, and surface server errors via `setError`. Use `register` for native inputs and `Controller` for components that don't forward refs (e.g. `Select`).
  - Every zod validator must include a human-readable English error message (e.g. `z.string().min(1, "Field is required")`). These strings serve as i18n keys and must be translated at the display site (see translation rules below).
  - Display validation errors translated: `<FieldError>{t(errors.field.message!)}</FieldError>`. Never render raw `errors.field.message` without `t()`.
- **Route files must stay thin.** Extract route-specific sub-components into co-located files in the same directory, prefixed with `-` (e.g. `-invite-form.tsx`). TanStack Router ignores `-`-prefixed files and folders during route generation, so they are never exposed as routes.
- **All user-visible strings must be translated.** Never hardcode display text and never use `t()` with dot-notation keys.
  - Use `<Trans t={t}>` for static JSX strings: `<Trans t={t}>Sign in</Trans>`.
  - Use `t(message)` for dynamic string values (validation errors, API error messages): `<FieldError>{t(errors.field.message!)}</FieldError>`.
  - A single locale file per language lives at `packages/i18n/locales/<lang>.json`. It is a nested object where top-level keys are namespaces (e.g. `"auth"`, `"bands"`) and values are flat objects keyed by natural English text: `{ "auth": { "Sign in": "Se connecter" } }`. Do not nest deeper than one level.
  - Specify the namespace via the `useTranslation` hook, not in the key itself: `const { t } = useTranslation("auth")` then `<Trans t={t}>Sign in</Trans>`. Never use the `"ns:key"` colon syntax.
  - When the string contains inline React elements (e.g. a `<strong>` or a `<Link>`), still use `<Trans>` — prefer indexed placeholders to keep locale files framework-agnostic: `<Trans t={t}>Click <Link to="/x">here</Link></Trans>`.

---

## tRPC usage

tRPC primitives (`router`, `publicProcedure`, `mergeRouters`) are initialized in `apps/api/src/trpc.ts`.

### Context

`Context` (defined in `apps/api/src/trpc.ts`) carries the instantiated port adapters for the request. Every adapter (repository, notifier, etc.) is placed here. Procedure handlers access adapters via `ctx`.

```ts
// apps/api/src/trpc.ts
export type Context = {
  session: ServerSession | null;
  admin: {
    organization: ReturnType<typeof makeAdminOrganizationRepo>;
  };
  userPermission: UserPermissionRepoPort;
  notifiers: { email: EmailNotifierPort };
  // ...
};
```

### Building an endpoint

Each procedure body instantiates a use-case factory with the required port adapters taken from `ctx`, then calls it with the validated `input`:

```ts
// apps/api/src/router/admin/organization.ts
export const makeOrganizationRouter = () =>
  router({
    list: adminProcedure.query(async ({ ctx }) => {
      return makeListOrganizations({
        organizationRepo: ctx.admin.organization,
      })();
    }),
  });
```

### Wiring into the app router

Add the new sub-router to `apps/api/src/router/index.ts`:

```ts
export const makeAppRouter = () =>
  mergeRouters(
    makeHealthRouter(),
    router({
      admin: makeAdminRouter(), // composes domain-area sub-routers
      invitation: makeInvitationRouter(),
    }),
  );

export type AppRouter = ReturnType<typeof makeAppRouter>;
```

### On the frontend (`/apps/web`)

- Import `type { AppRouter } from "@echo/api/router"` (type-only dependency).
- Create a tRPC client bound to `AppRouter` and expose typed hooks/utilities.
- Use tRPC queries/mutations inside React components and TanStack Router loaders/actions where appropriate.

### Rules for agents

- Sub-router factories take no arguments — all dependencies come from `ctx`.
- Every procedure body must call a use-case factory from `@echo/app`. Procedures must never call port adapters (`ctx.admin.*`, etc.) directly.
- Do not put business invariants in tRPC resolvers; keep them in domain/app layers.
- Use `adminProcedure` for admin-only endpoints, `authedProcedure` for authenticated endpoints, `publicProcedure` for public ones.
- Convert `AppError` exceptions to `TRPCError` at the boundary using `appErrorToTRPC` from `apps/api/src/lib/errors.ts`.
- When adding a new domain area, create a new sub-router factory in `apps/api/src/router/` and compose it into `makeAppRouter`.

---

## PostgreSQL persistence

PostgreSQL is the primary database. **Kysely** is used for queries and migrations. The `Database` interface and migration files live in `packages/db`.

Rules for agents:

- All DB access goes through adapters implementing repository ports in the app layer.
- Implement adapters using a `KyselyDB` instance obtained from `makeDbAdapter` (via `@echo/db`). Map DB rows (snake_case) to domain types (camelCase) in the adapter.
- Do not import PostgreSQL client/ORM types in `packages/domain` or `packages/app`; keep them confined to `packages/db` and adapter modules in `apps/api` or `apps/cli`.
- For integration tests of DB adapters, use a real PostgreSQL instance (e.g. Testcontainers/Docker) rather than mocking the driver.
- Schema changes: add a new migration file to `packages/db/migrations/`, then run `pnpm --filter @echo/db migrate` to apply it.
- Kysely query patterns: `db.selectFrom('table').selectAll().where('col', '=', val).executeTakeFirst()`, `db.insertInto('table').values({...}).returningAll().executeTakeFirstOrThrow()`, `db.transaction().execute(async (trx) => {...})`.
- Repository port methods take `db: KyselyDB` as their first parameter (not baked into the adapter at construction). This lets a use case pass either the ambient connection or an open transaction (`db.transaction().execute(async (trx) => ...)`) to compose atomic operations across repositories.

---

## Functional style guidelines

We favor a functional style over classes in all layers.

Rules for agents:

- Prefer:
    - Type aliases, interfaces, and ADTs.
    - Pure functions and factory functions.
    - Explicit dependency injection via function parameters (or small `deps` objects).
- Avoid:
    - Domain classes with heavy method logic.
    - Static global singletons or service locators.
    - Hidden I/O inside constructors or getters.

Error handling:

All application errors are typed classes that extend the abstract `AppError` base class in `packages/app/src/errors.ts`. Each carries a `readonly type` discriminant string.

Available error types and their factory helpers:

| Class | `type` | Factory |
|---|---|---|
| `NotFoundError` | `"NOT_FOUND"` | `notFound(entity)` |
| `ConflictError` | `"CONFLICT"` | `conflict(message)` |
| `UnauthorizedError` | `"UNAUTHORIZED"` | `unauthorized(message)` |
| `ForbiddenError` | `"FORBIDDEN"` | `forbidden({ entity, action })` |
| `DataValidationFailedError` | `"DATA_VALIDATION_FAILED"` | `dataValidationFailed(zodErrors, entity)` |
| `DatabaseError` | `"DATABASE_ERROR"` | `dbError(message)` |
| `UnknownError` | `"UNKNOWN"` | `unknownError(message?)` |

Rules for agents:

- **Throw** these errors from use cases and adapters using the factory helpers — never construct `TRPCError` or raw `Error` below the API boundary.
- **Catch and convert** at the tRPC boundary by wrapping the use-case call in a try/catch and passing the caught error to `appErrorToTRPC` from `apps/api/src/lib/errors.ts`:

```ts
try {
  return await makeMyUseCase(deps)(input);
} catch (e) {
  throw appErrorToTRPC(e);
}
```

- **Adding a new error type**: add the class (extending `AppError`) and its factory to `packages/app/src/errors.ts`, then add the corresponding `case` to the `switch` in `apps/api/src/lib/errors.ts`. No other files need to change.
- Never add domain or application error logic inside tRPC resolvers or Fastify handlers.
- tRPC errors returned to the client must use the semantically correct HTTP-mapped code (`NOT_FOUND`, `CONFLICT`, `UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`, etc.) and carry a human-readable `message`. Never return a generic `INTERNAL_SERVER_ERROR` for a known application error.

---

## Dependency rules

- `packages/domain` must not depend on any other internal package.
- `packages/auth` must not depend on `packages/domain`, `packages/app`, or any app. It depends only on external libs (better-auth, drizzle-orm, zod).
- `packages/app` may depend on `packages/domain` and `packages/auth` only.
- `packages/db` must not depend on `packages/domain`, `packages/app`, or any app. It depends on `packages/auth` (for the auth schema) and external libs (drizzle-orm, postgres).
- `apps/api` may depend on `packages/db`, `packages/auth`, `packages/app`, and external libs/frameworks (Fastify, tRPC, etc.). It must not depend on `packages/domain`.
- `apps/cli` may depend on `packages/db`, `packages/auth`, `packages/app`, and external libs (Commander, zod). It must not depend on `packages/domain`.
- `apps/web` may depend on `packages/auth` (for client auth), `packages/domain` and must not depend on `packages/app` directly, except for shared read-only types.

Agents must preserve this direction: **dependencies always point inward toward the domain**, never outward.

---

## Turborepo tasks (for agents)

When adding or editing tasks, follow these conventions:

- Use root scripts to orchestrate workspaces, e.g.:
    - `pnpm dev` – runs dev servers for `web` and `api`.
    - `pnpm build` – builds all apps and packages.
    - `pnpm test` – runs tests (Vitest) across the monorepo.
- Individual app/package scripts:
    - `apps/web`: `dev:web` (Vite dev), `build:web`, `test:web` (Vitest), `storybook` (Storybook dev server).
    - `apps/api`: `dev:api` (Fastify/tRPC dev server, possibly via Vite/node scripts), `build:api`, `test:api` (Vitest).
    - `apps/cli`: `pnpm cli <command>` (runs `tsx src/main.ts` via root script).
    - `packages/db`: `generate` (drizzle-kit generate), `migrate` (drizzle-kit migrate).
    - Packages: `build`, `test` per package.

Agents should:

- Use existing scripts where possible.
- Add new tasks with clear, descriptive names and proper `turbo.json` pipeline entries.
- Configure caching appropriately (e.g. cache builds and tests per package/app).

---

## Testing strategy (Vitest)

Vitest is the default test runner.

Rules for agents:

- Domain (`packages/domain`):
    - Test pure functions with Vitest, no mocks, no DB, no HTTP.
- Application layer (`packages/app`):
    - Mock ports with simple in-memory doubles or fakes.
    - Focus tests on use case behavior, not external integration.
- Adapters \& API (`apps/api`):
    - Use unit tests for small adapter logic where helpful.
    - Prefer integration tests against Fastify routes/tRPC endpoints and PostgreSQL where meaningful.
- CLI (`apps/cli`):
    - Unit tests for pure utility modules (formatters, etc.).
    - Integration tests for commands against a test PostgreSQL instance.
- Frontend (`apps/web`):
    - Use Vitest + React Testing Library or similar for components and hooks.

---

## Auth guards, permissions, and RBAC

### 1. Role type: source of truth

`SystemRole` is derived from the `roles` const in `packages/auth/src/plugins/admin/permissions.ts` and re-exported from `packages/auth/src/index.ts`:

```ts
// packages/auth/src/plugins/admin/permissions.ts
export const systemRoleSchema = z.enum(["admin", "client"]);
export type SystemRole = z.infer<typeof systemRoleSchema>; // "admin" | "client"
export const systemRole = systemRoleSchema.enum;
```

Rules for agents:
- Never use raw string literals (`"admin"`, `"client"`) in role comparisons — always use a `SystemRole`-typed constant or a domain predicate.
- Adding a new role to `roles` automatically widens `SystemRole`; any typed constant or exhaustive check will flag the addition.
- `SystemRole` is the single source of truth — do not redeclare it elsewhere.

### 2. Permission functions in `packages/domain`

Permission predicates live in `packages/domain/src/user/permissions/index.ts`. They are pure functions accepting `ClientSession | ServerSession | null | undefined`:

```ts
import type { ClientSession } from "@echo/auth/client";
import type { ServerSession } from "@echo/auth/server";
import type { SystemRole } from "@echo/auth";

const ADMIN_ROLE: SystemRole = "admin";

export const isSystemAdmin = (
  session: ClientSession | ServerSession | null | undefined,
): boolean => {
  if (!session) return false;
  return (session.user.role as SystemRole) === ADMIN_ROLE;
};
```

Rules for agents:
- The `as SystemRole` cast is the **only** escape hatch from better-auth's `string` inference — keep it inside the predicate, never at call sites.
- Type the comparison constant as `SystemRole` so a role rename in `roles` surfaces here immediately.
- Add new predicates to this file; do not inline role comparisons at call sites.

### 3. Auth guards in TanStack Router (`apps/web`)

Layout-route guard files are named `_<name>-guard/route.tsx` and use `beforeLoad`:

```ts
// apps/web/src/routes/_admin-guard/route.tsx
import { createFileRoute, redirect } from "@tanstack/react-router";
import { isSystemAdmin } from "@echo/domain/user";

export const Route = createFileRoute("/_admin-guard")({
  beforeLoad: ({ context }) => {
    if (!isSystemAdmin(context.auth)) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
});
```

Rules for agents:
- Use `context.auth` (injected via router context), not the imported `authClient`, inside `beforeLoad`.
- Always redirect to `/login` with `search.redirect` so the user can return after authenticating.
- Call domain predicates (`isSystemAdmin`, etc.) — do not inline role string comparisons in route files.

### 4. Auth guards in tRPC (`apps/api`)

`authedProcedure` and `adminProcedure` are defined in `apps/api/src/trpc.ts` as middleware chains:

```ts
// apps/api/src/trpc.ts
import { isSystemAdmin } from "@echo/domain/user";

export const authedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, session: ctx.session } });
});

export const adminProcedure = authedProcedure.use(({ ctx, next }) => {
  if (!isSystemAdmin(ctx.session)) throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});
```

Rules for agents:
- Session is injected via `createContext` from Fastify request headers — never read it directly from the request inside a procedure.
- Compose procedures: `adminProcedure` extends `authedProcedure`, not `publicProcedure`.
- Use domain predicates for authorization checks, not raw role string comparisons.

### 5. Role-based navigation

`generateMenuFromSession` in `apps/web/src/lib/navigation/index.ts` is a pure function that uses domain predicates:

```ts
import { isSystemAdmin } from "@echo/domain/user";

export const generateMenuFromSession = (session: ClientSession | null): MenuItem[] => {
  const items: MenuItem[] = [{ label: "Accueil", to: "/" }];

  if (isSystemAdmin(session)) {
    items.push({ label: "Administration", children: [...] });
  }

  return items;
};
```

Rules for agents:
- `generateMenuFromSession` must remain a pure function — no async, no data fetching.
- Use `isSystemAdmin(session)` (or other domain predicates) instead of `session?.user.role === "admin"`.
- Do not import `@echo/auth` directly in navigation utilities; go through domain predicates.

---

## Documentation

`README.md` at the repo root is the single source of truth for how the project works. Agents must keep it accurate and up to date.

Rules for agents:
- **Always update `README.md`** when making any change that affects architecture, conventions, tooling, packages, scripts, or how a layer is used.
- Update the relevant section in place — do not append a changelog or create separate doc files.
- If no section exists for the changed area, add one.
- Treat an outdated README as a bug: if you notice a statement that no longer reflects the code, fix it.
- Keep the README concise and human-readable — prefer short prose and focused tables over exhaustive lists. If a section grows too long, trim it rather than expanding it.
