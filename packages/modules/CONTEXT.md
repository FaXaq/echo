# Modules

Domain modules for Echo: calendar, drive, invitation, notification, organization, place, plan, user. Each module has `domain/`, `app/`, and `infrastructure/` layers.

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

**Drive**:
The Organization-wide view of all of an Organization's files, arranged into Folders. Distinct from an Event's file list, which shows only files attached to that Event regardless of which Folder (if any) they sit in — a file can be attached to an Event and organized into a Folder at the same time; the two are independent.
_Avoid_: File browser

**Folder**:
A named container for organizing an Organization's Drive files, nestable arbitrarily deep under other Folders. Scoped only to the Organization — a Folder has no Event (or, in future, Song) scoping, unlike `file`. The hierarchy root is implicit: a `null` parent (on a Folder) or a `null` folder (on a file) means "at Drive root," the same nullable-FK convention already used for `file.eventId`.
_Avoid_: Directory

**Selection**:
A set of Drive rows (files and/or folders, any mix) marked for a Bulk Action within the current folder view — via row checkbox or shift/cmd-click. Scoped to one folder view: navigating to a different folder clears it.
_Avoid_: Multi-select (reserve for the UI mechanism, not the resulting set)

**Bulk Action**:
An operation applied to an entire Selection at once. Drive supports two: dragging a Selection onto a folder (move — any mix of files/folders), and downloading a Selection (files only — a Selection containing any folder cannot be downloaded as a group).
_Avoid_: Batch action

**OS File Drop**:
Dragging files from outside the browser (the OS file system) onto the Drive table to upload them — into the current folder, or into a specific Folder row if dropped while hovering it. Not a Bulk Action: it acts on incoming external files, not on a Selection of existing Drive rows, and is a separate mechanism from the Selection drag-to-move despite both ending in a folder as the target. Dropping a whole OS directory (not just files) is rejected, not flattened or recreated.
_Avoid_: Drag-and-drop upload (ambiguous with Selection drag-to-move)

**Drive Search**:
A whole-Organization, cross-folder lookup by file or folder name (plain substring match), surfaced as type-ahead results separate from the folder-browsing table rather than filtering it in place. Distinct from folder navigation and from Selection — neither is affected by searching. A matched file's result navigates to its containing Folder; a matched folder's result navigates directly into it.
_Avoid_: Filter (reserve for the future date/size/event facets, not yet built)

## Exceptions

**Invitation lookup by id** (`invitation/infrastructure/get-invitation-by-id.ts`) does not require Organization Scope. An invitee looking up their invitation isn't an Organization member yet, so there's no membership to verify — the invitation id itself is the capability that grants read access, not scope.
