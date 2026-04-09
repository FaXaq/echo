## ADDED Requirements

### Requirement: Modules package provides vertically-sliced feature modules
The `@echo/modules` package SHALL expose each feature module via subpath exports covering `domain`, `infrastructure`, and `use-cases` layers. Every module's `infrastructure` export SHALL contain both the port interface(s) and the adapter factory function(s) for that module.

#### Scenario: Import domain types from a module
- **WHEN** a consumer imports from `@echo/modules/<module>/domain`
- **THEN** the TypeScript type definitions for that module's entities are available with no runtime dependencies on databases or external services

#### Scenario: Import infrastructure from a module
- **WHEN** a consumer imports from `@echo/modules/<module>/infrastructure`
- **THEN** both the port interface (TypeScript type) and the adapter factory function (e.g., `makeSongRepo`) are available from the same path

#### Scenario: Import use-cases from a module
- **WHEN** a consumer imports from `@echo/modules/<module>/use-cases`
- **THEN** all use-case factory functions for that module are available (e.g., `makeCreateSong`, `makeListSongs`)

### Requirement: All ten feature modules are present
The package SHALL include modules for: `song`, `track`, `audio-clip`, `midi-clip`, `file`, `invitation`, `organization`, `user`, `notification`, and `health`.

#### Scenario: Song module subpath exports resolve
- **WHEN** a TypeScript project imports from `@echo/modules/song/domain`, `@echo/modules/song/infrastructure`, and `@echo/modules/song/use-cases`
- **THEN** all three paths resolve without TypeScript errors

#### Scenario: All modules resolve
- **WHEN** TypeScript type-checks a file importing from all ten modules' domain, infrastructure, and use-cases subpaths
- **THEN** all imports resolve successfully

### Requirement: Use-cases from modules replace those previously in @echo/app
All use-case factory functions previously exported from `@echo/app/src/use-cases/` SHALL be available from the corresponding module's `use-cases` subpath in `@echo/modules`.

#### Scenario: Song use-cases are accessible
- **WHEN** `apps/api` imports `makeCreateSong` from `@echo/modules/song/use-cases`
- **THEN** the function is available and type-checks correctly against the `SongRepoPort` from `@echo/modules/song/infrastructure`

### Requirement: Adapter factories accept the same dependencies as before
Adapter factory functions moved into module infrastructure SHALL accept the same constructor dependencies (e.g., `{ db: KyselyDB }`) they accepted when they lived in `apps/api/src/adapters/`.

#### Scenario: makeSongRepo accepts KyselyDB
- **WHEN** `makeSongRepo({ db })` is called with a `KyselyDB` instance
- **THEN** it returns an object satisfying `SongRepoPort`

### Requirement: User domain module exposes permission predicates
The `@echo/modules/user/domain` export SHALL expose `isSystemAdmin`, `canUpdateOrgMemberRole`, `canRevokeMembership`, and `canCancelInvitation` permission predicate functions.

#### Scenario: Web app imports user permission predicates
- **WHEN** `apps/web` imports `isSystemAdmin` from `@echo/modules/user/domain`
- **THEN** the function is available and type-checks with `ClientSession | ServerSession | null | undefined` as argument

### Requirement: packages/domain and packages/app no longer exist
After migration, the `packages/domain` and `packages/app` directories SHALL be deleted from the repository, and no package in the workspace SHALL declare a dependency on `@echo/domain` or `@echo/app`.

#### Scenario: No remaining @echo/domain or @echo/app imports
- **WHEN** the full codebase is searched for imports of `@echo/domain` or `@echo/app`
- **THEN** no matches are found in any source file
