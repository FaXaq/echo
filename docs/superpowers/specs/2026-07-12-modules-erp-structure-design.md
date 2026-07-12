# Design: Align `packages/modules` structure and DB transaction handling with `../erp`

## Context

`../erp` is a sibling monorepo built on the same DDD/hexagonal conventions as `echo`, but its `packages/modules` layer has evolved two patterns that `echo` currently lacks:

1. A more granular module file layout (one file per use case / port / adapter instead of one monolithic file per concern).
2. A DB transaction pattern that threads an explicit executor handle through every repository call, enabling a use case to atomically span multiple repositories.

This design ports both patterns into `echo`, adapted for Kysely (erp uses Drizzle).

Confirmed out of scope: erp's `packages/modules/src/ddd` toolkit (class-based `AggregateRoot`/`Entity`/`ValueObject`/`Result`). `echo`'s `AGENTS.md` mandates plain type aliases/ADTs over classes; this stays unchanged.

No database schema changes and no new cross-repo transactional *use case* are introduced — this is a structural refactor that preserves current behavior while adding the capability to compose repositories atomically.

## Current state (echo)

Each module under `packages/modules/src/<name>/` has three folders:

- `domain/index.ts` — pure types (kept as-is, already matches erp's convention).
- `infrastructure/index.ts` — one file containing the repo port interface **and** the Kysely adapter factory. `db: KyselyDB` is bound once at construction: `makeTrackRepo({ db }): TrackRepoPort`. Port methods take no `db` argument.
- `use-cases/index.ts` — one file containing every use case as a curried factory: `makeCreateTrack = (deps: { trackRepo }) => async (input) => {...}`.

`apps/api/src/context.ts` builds every repo once per request (even ones with no per-request state), always passing the same singleton `db`. Because `db` is baked into each repo at construction, no use case can open one transaction and pass it into two different repos — the only transactions today are internal to a single repo method (e.g. `track.reorder`).

## Target state

### Module structure

For each module in `packages/modules/src/<name>/`:

- `domain/index.ts` — unchanged.
- `infrastructure/`
  - `<name>-repository.port.ts` — the port interface only. Every method's first parameter is `db: KyselyDB`.
  - `<name>-repository.kysely.ts` — `makeXRepo(nonDbDeps)` factory implementing the port. `nonDbDeps` excludes `db` (only things like `auth`, `headers`, `mailer` remain, for the modules that need them).
  - `index.ts` — barrel re-exporting the port type and the factory.
- `app/` (replaces `use-cases/`)
  - One file per use case, kebab-case filename matching the function name (e.g. `create-track.ts` exports `createTrack`).
  - Flat signature: `export async function createTrack(deps, input) { ... }` — no currying.
  - `index.ts` — barrel re-exporting every use case.

This is a mechanical, behavior-preserving transform of the 36 existing use-case functions and 11 infrastructure files across: `audio-clip`, `file`, `health`, `invitation`, `midi-clip`, `notification`, `organization`, `song`, `song-section`, `track`, `user`.

### DB transaction handling

No new wrapper type is needed. Kysely's `Transaction<DB> extends Kysely<DB>`, so the existing `KyselyDB` type exported from `@echo/db` already covers both the root connection and an open transaction handle — this is simpler than erp's custom `DbExecutor` (which Drizzle requires because its transaction handle type differs from its root handle type).

Changes:

- Repo factories drop `db` from their constructor deps. `makeTrackRepo({ db })` becomes `makeTrackRepo()`; repos that need other per-request state (e.g. `organization`, `user`) keep that state in the factory, just not `db`.
- Every port method takes `db: KyselyDB` as its first explicit parameter, e.g.:
  ```ts
  export interface TrackRepoPort {
    list: (db: KyselyDB, input: { songId: string }) => Promise<Track[]>;
    // ...
  }
  ```
- Use cases receive `db: KyselyDB` in `deps` and forward it into repo calls. A use case that needs atomicity across repositories does:
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
- `apps/api/src/context.ts`: repos with no other per-request dependency become module-level singletons (built once at startup, since they no longer close over `db`); repos needing session/headers remain per-request, minus `db`.
- `apps/api/src/router/**`: every call site changes from `makeCreateTrack({ trackRepo: ctx.track })(input)` to `createTrack({ trackRepo: ctx.track, db: ctx.db }, input)`.

### Documentation

`AGENTS.md`'s "Application layer" section currently describes a `packages/domain` + `packages/app` split that matches neither the current nor the target layout (the real structure consolidated into `packages/modules/src/<name>/{domain,app,infrastructure}` back in the 004-daw-refactor work). This design corrects that section to document the actual layout and the new transaction convention, scoped only to what's changing here.

## Rollout order

1. Prove the pattern end-to-end on `track` (mid-sized: plain CRUD plus one existing internal `.transaction()` call in `reorder`, so it exercises both the port/adapter split and the transaction-handle threading).
2. Apply the identical mechanical transform to the remaining modules: `song`, `song-section`, `audio-clip`, `midi-clip`, `invitation`, `health`, `notification`, `organization`, `user`, `file`.
3. Update `context.ts` and all `apps/api/src/router/**` call sites as each module converts (can be done per-module to keep the build green throughout).
4. Update the `AGENTS.md` module-structure section.

## Testing

There are currently no unit tests under `packages/modules`. Verification for this change is: typecheck (`pnpm build` / `tsc`), existing `pnpm test` suite (integration-level, e.g. `apps/api`) staying green, and a manual smoke pass over the affected tRPC endpoints (song/track/section CRUD) after each module migrates. No new test suite is being introduced as part of this refactor unless requested separately.
