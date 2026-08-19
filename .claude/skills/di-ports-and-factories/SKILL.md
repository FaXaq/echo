---
name: di-ports-and-factories
description: Use when adding or modifying anything under packages/modules/src/<module>/infrastructure or packages/modules/src/<module>/app — covers the port/factory shape, when db/scope are explicit args vs. closed-over adapter deps, and why app/ code may never import infrastructure/ directly
---

# DI: Ports and Factories

## Overview

Every module under `packages/modules/src` has `domain/`, `app/`, and `infrastructure/` layers. `infrastructure/` talks to the outside world (Postgres via Kysely, better-auth, S3, ...); `app/` holds business logic and is unit-tested with fakes. The pattern below (first established in `calendar/` and `organization/infrastructure`) is how those two layers connect. See ADR-0004 for the full rationale, including the concrete test-quality regression this fixes.

## Core Rules

0. **An `app/` function never imports and calls an `infrastructure/` function directly — not its own module's, not another module's.** Every infrastructure dependency an `app/` function needs arrives through its `deps` parameter, typed against the port. This is the rule with teeth: it's what lets a test build a literal fake function instead of `vi.spyOn`-ing a real module. If you're writing an `app/` function and reaching for an `import { xByY } from "../infrastructure/index.js"` to call inline, stop — add it to `deps` instead, sourced from a `.port.ts` type.

1. **Every `infrastructure/` function called by an `app/` function is a port**, defined as a matched pair:
   - `<name>.<command|query|check>.port.ts` — the port's function type, its input type (if any), and a `PortFactory` type.
   - `<name>.<command|query|check>.<adapter>.ts` — the implementation, e.g. `.kysely.ts` for Postgres, `.better-auth.ts` for better-auth. `command` = write, `query` = read, `check` = capability/permission check (neither CRUD role).

   Infrastructure helpers used only by other infrastructure files (never by `app/`) don't need this — the boundary that matters is `app/` → `infrastructure/`, not `infrastructure/` internals.

2. **Two dependency kinds, threaded two different ways:**
   - Stable external adapters (an auth client, mailer, S3, geocoding, ...) are closed over by the factory: `type XPortFactory = (deps: { auth: ServerAuth; headers?: Headers }) => XPort`.
   - Per-call context that can't be a singleton — `db`, and always `OrganizationScope` (a per-request authorization proof; see ADR-0002/0003, it structurally cannot live in a factory closure) — stays an explicit argument on the port function itself: `type XPort = (db: KyselyDB, scope: OrganizationScope, input: XInput) => Promise<Result>`.

   These are not two competing styles to choose between — apply both in the same port when both dependency kinds are present. A port with no adapter dependency gets a zero-arg factory shorthand, `() => XPort` — don't force an empty `deps: {}` for uniformity.

   ```ts
   // insert-thing.command.port.ts
   export type InsertThingInput = { id: string; title: string };
   export type InsertThingCommandPort = (
     db: KyselyDB,
     scope: OrganizationScope,
     input: InsertThingInput,
   ) => Promise<Thing>;
   export type InsertThingCommandPortFactory = () => InsertThingCommandPort;

   // insert-thing.command.kysely.ts
   export const insertThingCommandFactory: InsertThingCommandPortFactory =
     () => async (db, scope, input) => { /* ... */ };
   ```

3. **Even a single extra field is an `input` object, not a positional argument** — `(db, scope, input: { id: string })`, never `(db, scope, id)`. Queries with nothing beyond scope take no `input` at all: `(db, scope) => Promise<Thing[]>`.

4. **Factories are instantiated once and passed through `deps`** — at the top of the tRPC router module (`const insertThingCommand = insertThingCommandFactory();`) for adapter-free ports, or inside the request handler for ports whose factory needs per-request deps like `headers` (see `organization`'s router). Never call a factory inside an `app/` function or a test.

5. **Tests fake the port directly**, typed against the exported port type — no `vi.spyOn` on an `infrastructure/index.js` import:
   ```ts
   const insertThingCommand: InsertThingCommandPort = async (_db, _scope, input) => makeFakeThing(input);
   ```
   `db` itself can't be `{} as any`/`as never` — the repo bans `as`. Build a real (never-connected) handle with `makeDbAdapter({ host: "localhost", port: 5432, user: "test", password: "test", name: "test" }).db` and pass that.

## Migration status

`calendar` and `file` are fully on this pattern. `organization` is on it for its own ports but predates the `db`/`scope` convention (its ports don't touch organization-scoped tables). `user`, `plan`, `place`, `invitation`, `notification` are not yet migrated — see the tracking ticket (ECH) for scope. Follow this pattern for anything new or touched in those modules; don't block unrelated work on a full retrofit.
