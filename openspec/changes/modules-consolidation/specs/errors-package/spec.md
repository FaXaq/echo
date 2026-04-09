## ADDED Requirements

### Requirement: Errors package provides the AppError hierarchy
The `@echo/errors` package SHALL export the `AppError` abstract base class and all concrete error subclasses: `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`, `DataValidationFailedError`, `DatabaseError`, and `UnknownError`.

#### Scenario: Import AppError and subclasses
- **WHEN** any package imports from `@echo/errors`
- **THEN** `AppError`, all concrete error classes, and their factory helpers are available

### Requirement: Errors package exports factory helper functions
The package SHALL export factory functions (`notFound`, `conflict`, `unauthorized`, `forbidden`, `dataValidationFailed`, `dbError`, `unknownError`) that construct the corresponding error instances.

#### Scenario: Factory helpers create typed errors
- **WHEN** a use-case calls `notFound("Song")`
- **THEN** the result is a `NotFoundError` instance with `type === "NOT_FOUND"` and `entity === "Song"`

### Requirement: Errors package has minimal dependencies
The `@echo/errors` package SHALL depend only on `zod` (for `DataValidationFailedError` which accepts `ZodError[]`). It SHALL NOT depend on any other internal `@echo/*` package or external framework.

#### Scenario: Errors package installs without pulling in @echo/db or other heavy packages
- **WHEN** only `@echo/errors` is added as a dependency
- **THEN** no `kysely`, `@aws-sdk`, `nodemailer`, or other infrastructure packages are installed as transitive dependencies

### Requirement: @echo/modules and apps/api both import errors from @echo/errors
After migration, `AppError` and its subclasses SHALL NOT be defined in `@echo/modules` or `apps/api`. Both SHALL import from `@echo/errors`.

#### Scenario: Use-case throws a typed error importable from @echo/errors
- **WHEN** a use-case in `@echo/modules/song/use-cases` throws `notFound("Song")`
- **THEN** the error is an instance of `NotFoundError` imported from `@echo/errors`, and `apps/api/lib/errors.ts` can catch and convert it using the same import
