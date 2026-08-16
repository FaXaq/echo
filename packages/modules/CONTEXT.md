# Modules

Domain modules for Echo: calendar, file, invitation, notification, organization, place, plan, user. Each module has `domain/`, `app/`, and `infrastructure/` layers.

## Language

**Organization**:
The tenant boundary. Every user has a personal Organization (`isPersonal: true`) created for them; bands/groups are non-personal Organizations. All organization-owned data (files, calendar events, invitations, plan usage) is scoped to exactly one Organization.
_Avoid_: Tenant, account, workspace

**Organization Scope**:
Proof that a caller is authorized to act within a specific Organization. Constructed only two ways: by the organization-scoped tRPC procedure (verifies the requester's membership) or by a system-trusted constructor for non-request code (better-auth lifecycle hooks, cron/migrations) where authority is established some other way. Infrastructure functions that read or write organization-owned data require it instead of a raw organization id — see ADR-0002 and ADR-0003.
_Avoid_: organizationId (as a bare string once scope exists — the raw id doesn't carry the verification guarantee)

**Organization Permission Check**:
Whether a caller may act within an Organization. With no specific permission requested, it is membership-only — the caller must belong to the Organization, independent of role. With a specific permission requested, the caller's role must grant it.

**Storage Quota**:
An Organization's storage usage against the limit its Plan allows: usage summed from its uploaded/pending files, limit read from `planCatalog`. Computed in `plan`'s app layer and exposed via `organization.plan.quota.storage`, gated on the `quota` permission (distinct from `plan`, which gates Plan/features visibility). The single source of truth for storage usage — `plan.overview` does not duplicate it.
_Avoid_: reading storage usage off `plan.overview` (removed; would drift from the quota endpoint, which is the one invalidated on file upload/delete)

## Exceptions

**Invitation lookup by id** (`invitation/infrastructure/get-invitation-by-id.ts`) does not require Organization Scope. An invitee looking up their invitation isn't an Organization member yet, so there's no membership to verify — the invitation id itself is the capability that grants read access, not scope.
