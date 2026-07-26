# Decouple event details modal from attachment management

## Problem

Attachment management is currently split awkwardly between two surfaces:

- `EventDialog` (the edit modal, `apps/web/src/components/ui/event-calendar/event-dialog.tsx`) renders `EventFileAttachments` when editing an existing event — an upload dropzone plus a plain list of filenames with delete buttons.
- `EventDetail` (the full event-details page, `apps/web/src/components/ui/event-calendar/event-detail.tsx`, mounted at `/calendar/$eventId` and `/organizations/$organizationSlug/calendar/$eventId`) renders `EventAttachments` — a read-only display of the same files (audio players + `EventGallery` thumbnails with a lightbox).

If both were left as-is with the modal editing files and the page displaying them, the two responsibilities would fight each other and, if ever shown together, duplicate the same files in two different UIs. This change makes the modal responsible only for event fields, and the page responsible for both viewing and managing attachments.

## Target state

- `EventDialog` — event fields only (title, description, start/end, all-day, color). No attachment UI, no `organizationId` prop.
- `EventDetail` page — the single place to view **and** manage (upload/delete) attachments, unified into one section rather than two redundant ones.

## Changes

1. **`apps/web/src/components/event-calendar/event-attachments.tsx`**
   Absorbs `EventFileAttachments`'s upload/delete logic. Gains an `organizationId?: string` prop (passed through to `useUploadFileMutation`). Renders, inside the existing `Suspense`/skeleton boundary:
   - A `FileUpload` dropzone at the top (`accept="audio/*,video/*,image/*"`), wired to `useUploadFileMutation`, with the existing inline error message on failure.
   - The existing audio list (unchanged visually) — each item gains a small delete icon button, guarded by the existing `AlertDialog` confirm pattern ("Delete this file?"), wired to `useDeleteFileMutation`.
   - `EventGallery`, now passed an `onDelete` callback (see below).

2. **`apps/web/src/components/ui/event-gallery.tsx`**
   Add an optional `onDelete?: (file: EventFile) => void` prop. When provided, each grid thumbnail gets a small delete icon button (stops propagation so it doesn't also open the lightbox) guarded by the same `AlertDialog` confirm pattern. The lightbox itself gets no delete action — kept out of scope to avoid extra surface area for this change.

3. **`apps/web/src/components/event-calendar/event-file-attachments.tsx`**
   Deleted — logic fully merged into `event-attachments.tsx`.

4. **`apps/web/src/components/ui/event-calendar/event-dialog.tsx`**
   Remove the `isEdit && <EventFileAttachments .../>` block and its import. Remove the now-unused `organizationId` prop from `EventDialogProps` (nothing else in the dialog uses it).

5. **`apps/web/src/components/ui/event-calendar/event-detail.tsx`**
   Add an `organizationId?: string` prop, forwarded to `EventAttachments`.

6. **Routes**
   - `apps/web/src/routes/calendar/$eventId.tsx` — no change (no org context; already doesn't pass `organizationId` anywhere).
   - `apps/web/src/routes/organizations/$organizationSlug/calendar/$eventId.tsx` — move `organizationId={organizationId}` from `<EventDialog>` to `<EventDetail>`.

## Data flow

No backend/tRPC changes. Both upload and delete continue to go through the existing `apps/api/src/router/file.ts` procedures (`createUpload`, `confirmUpload`, `deleteFile`) via the existing frontend hooks in `apps/web/src/services/resources/file.ts` (`useUploadFileMutation`, `useDeleteFileMutation`, `getEventFilesQueryOptions`). Both mutations already invalidate the shared `file` query key on success, so the unified display refreshes automatically after upload or delete — no new invalidation logic needed.

## Error handling

Unchanged from existing patterns: upload failures show the existing inline error message under the dropzone; deletes require confirmation via `AlertDialog` before the mutation fires. No new error paths are introduced.

## Testing

- `apps/web/src/components/event-calendar/event-attachments.test.tsx` — extend to cover upload and delete-with-confirm for both audio items and gallery items.
- `apps/web/src/components/event-calendar/event-file-attachments.test.tsx` — deleted (component removed).
- `apps/web/src/components/ui/event-gallery.test.tsx` — extend to cover the new `onDelete` prop and its confirm flow.
- `apps/web/src/components/ui/event-calendar/event-detail.test.tsx` — extend to cover `organizationId` passthrough to `EventAttachments`.
- No test currently exists for `event-dialog.tsx`; none added, since this change only removes code from it.

## Out of scope

- No delete action inside the gallery lightbox (view-only there).
- No changes to the upload/delete tRPC procedures or backend file module.
- No changes to how attachments are surfaced elsewhere (e.g. calendar grid event cards, if any).
