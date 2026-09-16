# Modules

Domain modules for Echo: calendar, drive, invitation, notification, organization, place, plan, user. Each module has `domain/`, `app/`, and `infrastructure/` layers.

## Language

**Organization**:
The tenant boundary. Every user has a personal Organization (`isPersonal: true`) created for them; bands/groups are non-personal Organizations. All organization-owned data (files, calendar events, invitations, plan usage) is scoped to exactly one Organization.
_Avoid_: Tenant, account, workspace

**Invitation**:
A pending request for a specific email address to join an Organization at a given role, identified by an unguessable id. The id alone is the access capability for looking it up and accepting it — the invitee isn't an Organization member yet, so there's no membership scope to check (see Exceptions).
_Avoid_: Invite (fine as a verb, avoid as a noun for the record itself)

**Organization Scope**:
Proof that a caller is authorized to act within a specific Organization. Constructed only two ways: by the organization-scoped tRPC procedure (verifies the requester's membership) or by a system-trusted constructor for non-request code (better-auth lifecycle hooks, cron/migrations) where authority is established some other way. Infrastructure functions that read or write organization-owned data require it instead of a raw organization id — see ADR-0002 and ADR-0003.
_Avoid_: organizationId (as a bare string once scope exists — the raw id doesn't carry the verification guarantee)

**Organization Permission Check**:
Whether a caller may act within an Organization. With no specific permission requested, it is membership-only — the caller must belong to the Organization, independent of role. With a specific permission requested, the caller's role must grant it.

**Storage Quota**:
An Organization's storage usage against the limit its Plan allows: usage summed from its uploaded/pending files, limit read from `planCatalog`. Computed in `plan`'s app layer and exposed via `organization.plan.quota.storage`, gated on the `quota` permission (distinct from `plan`, which gates Plan/features visibility). The single source of truth for storage usage — `plan.overview` does not duplicate it.
_Avoid_: reading storage usage off `plan.overview` (removed; would drift from the quota endpoint, which is the one invalidated on file upload/delete)

**Drive**:
The Organization-wide view of all of an Organization's files, arranged into Folders. Distinct from an Event's or a Song's file list, each of which shows only files attached to that Event/Song regardless of which Folder (if any) they sit in — a file can be attached to an Event, any number of Songs (see Song File Link), and organized into a Folder all at the same time. Only the Event attachment and Song File Links protect a file from deletion: a file is deleted only once none remain, independent of whether it also sits in a Folder. Folder membership is a location, not a protecting attachment — it follows Folder's own (pre-existing, unrelated) deletion behavior.
_Avoid_: File browser

**Folder**:
A named container for organizing an Organization's Drive files, nestable arbitrarily deep under other Folders. Scoped only to the Organization — a Folder has no Event or Song scoping, unlike `file`. The hierarchy root is implicit: a `null` parent (on a Folder) or a `null` folder (on a file) means "at Drive root," the same nullable-FK convention already used for `file.eventId`/`file.songId`.
_Avoid_: Directory

**Song**:
An Organization-scoped creative work: title (required), and optional artist, BPM, musical key, markdown lyrics, and `'original' | 'cover'` type. Like an Event, a Song has its own file list, built from its Song File Links; a file can be attached to an Event and any number of Songs at the same time (see Drive), and deleting a Song only removes that Song's link — the file itself is deleted only once every link (Event or Song) is gone.
_Avoid_: Track

**Song File Link**:
The relation between a Song and a File (`song`/`file` join row), replacing a single `file.songId` FK now that a File can attach to more than one Song. Carries an optional Role and Version, plus who last changed either and when. Every file on a Song's file list has one, whether it's a plain attachment or also tagged with a Role. A file is attached first (plain, `role: null`) and tagged with a Role afterwards, from its own row's "Define as" menu — there is no upload-time role assignment.
_Avoid_: uploading directly as demo/final (removed — tagging is a separate action from attaching)

**Role**:
An optional tag on a Song File Link marking it `"demo"` or `"final"` — one Role per link, not a set. Distinct from `FileKind` (a file's media type — audio/video/image/document): Role is about which take of a Song's audio this is, not what kind of media it is. `null` means a plain attachment, same as any other file. Restricted to `FileKind: "audio"` links. Removable independently of the file itself via "Remove role," which reverts the link to a plain attachment (`role`/`version` both cleared) without deleting the file.

**Version**:
A per-`(song, role)` incrementing counter stored on the Song File Link, assigned when a Role is set. Re-tagging a link with the Role it already holds is a no-op — the existing version is kept, not bumped — so repeatedly confirming "Latest final" on the same file doesn't burn version numbers.

**Current Demo / Current Final**:
For a Song, the Song File Link with Role `"demo"` (or `"final"`) holding the highest Version. Marking a different file as, say, the latest demo doesn't remove the Role from earlier demo-tagged links; they stay as that Role's version history, ordered by Version.

**Primary Audio**:
A Song's single best-guess playable audio for a context with room for only one: its Current Final if one exists, otherwise its Current Demo, otherwise none. Computed, not stored. The Song's own detail page never needs it — every attached file is individually playable there — it exists for surfaces that show a Song as a single row (e.g. a Playlist's song list).

**Playlist**:
An Organization-scoped ordered list of Songs: title (required) and optional description. A Song can appear at most once in a Playlist (`playlist_song` is a unique `(playlist_id, song_id)` pair) — duplicate entries and manual reordering are deferred to ECH-106, which needs a per-row identity on `playlist_song` and a non-chip UI to support both. Order follows insertion order — there's no manual reordering; to change the order, remove and re-add Songs in the desired sequence. A Playlist may be linked to zero or more Events (e.g. a rehearsal or concert), and an Event may have several Playlists at once — both the Song and Event links are many-to-many, not single attachments. Colloquially, a Playlist linked to an Event is called a "Setlist," but there is no separate Setlist entity or table: it's the same Playlist, just in that role. Playlist CRUD is gated on the `playlist` permission, granted to every role (`member`/`owner`/`admin`) — the same tier as `calendarEvent`/`drive`/`quota`, not the `owner`/`admin`-only tier `plan` uses.
_Avoid_: Setlist (as a distinct entity — it's a usage of Playlist, not its own type)

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
