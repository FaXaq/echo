# Context Map

## Contexts

- [Modules](./packages/modules/CONTEXT.md) — domain modules (calendar, file, invitation, notification, organization, place, plan, user) and their application/domain/infrastructure layers

## Relationships

- **Modules ↔ Auth** (`packages/auth`): better-auth's `organization` plugin is the technical owner of the Organization entity (schema, membership, sessions); the Modules context's `organization` module builds business rules (personal organization resolution, quotas) on top of it.
