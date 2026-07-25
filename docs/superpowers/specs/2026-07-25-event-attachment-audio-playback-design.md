# Event Attachment Audio Playback — Design

Date: 2026-07-25

## Goal

On the event details page (`EventDetail`), let users play back audio files attached to the event, with a waveform visualization, inspired by (but scoped down from) the shadcn.io "music waveform editor" block. `EventDetail` currently doesn't render attachments at all — only the event edit dialog does (via `EventFileAttachments`, upload/delete only, no playback).

## Scope

- **Playback only.** No trimming, zooming, or exporting — attachments are reference audio, not audio being edited.
- Read-only attachment list on `EventDetail`: audio files get a waveform player; video/image files show as a plain filename row (no preview). No upload/delete controls here — those remain in the existing edit-dialog component.
- Waveform bars are computed from **real decoded audio data** (not placeholder/fake bars).

## Backend changes

### `S3StoragePort` — add presigned download URL

`packages/modules/src/file/infrastructure/s3-storage.port.ts`:

```ts
export interface S3StoragePort {
  createUploadUrl: (input: { key: string; contentType: string; contentLength: number }) => Promise<{ url: string }>;
  createDownloadUrl: (key: string) => Promise<{ url: string }>; // NEW
  headObject: (key: string) => Promise<{ exists: boolean; sizeBytes: number | null }>;
  deleteObject: (key: string) => Promise<void>;
}
```

Implemented in `packages/modules/src/file/infrastructure/s3-storage.adapter.ts` using `GetObjectCommand` + `getSignedUrl`, `expiresIn: 3600` (longer than the 300s upload window, since a playback session can run longer than an upload).

### `listEventFiles` — attach a download URL per file

`packages/modules/src/file/app/list-event-files.ts` gains `s3Storage: S3StoragePort` as a dependency. For each readable `FileRecord`, it calls `s3Storage.createDownloadUrl(file.s3Key)` and returns `FileRecord & { downloadUrl: string }`.

```ts
export async function listEventFiles(
  deps: { db: KyselyDB; fileRepo: FileRepoPort; userPermission: UserPermissionRepoPort; s3Storage: S3StoragePort },
  input: { eventId: string; userId: string },
): Promise<(FileRecord & { downloadUrl: string })[]>
```

`apps/api/src/router/file.ts` passes `ctx.s3Storage` through to `listEventFiles`. No new tRPC procedure — the existing `file.listEventFiles` query now returns `downloadUrl` on each item. `EventFile` (`apps/web/src/services/resources/file.ts`, inferred from `RouterOutputs`) picks this up automatically.

## Frontend changes

### `AudioPlayer` component (new)

`apps/web/src/components/ui/audio-player.tsx` + co-located `audio-player.stories.tsx` and `audio-player.test.tsx`.

```ts
export interface AudioPlayerProps {
  src: string       // downloadUrl
  filename: string  // for aria-label / error fallback
}
```

Behavior:
1. On mount, `fetch(src)` once → `arrayBuffer()`.
2. Decode via `AudioContext.decodeAudioData` to compute ~64 amplitude buckets (max abs sample per bucket across channel 0, normalized 0–1).
3. Wrap the same `ArrayBuffer` in a `Blob` and `URL.createObjectURL` it for the native `<audio>` element's `src` — avoids fetching the file twice (once for waveform decode, once for playback streaming). Revoke the object URL on unmount.
4. Render waveform as a row of flex `div` bars (height = amplitude %) in a muted color, with a foreground overlay (primary color, same bars, width clipped via `overflow-hidden` to `currentTime / duration`) showing playback progress.
5. Click anywhere on the waveform → seek (`audio.currentTime = (clickX / width) * duration`).
6. Play/pause icon button; current time / duration text (e.g. `0:12 / 1:34`), driven by the audio element's `timeupdate` / `loadedmetadata` / `ended` events.
7. Loading state (skeleton bars) while fetching + decoding.

**Error handling:** if fetch or `decodeAudioData` fails, fall back to the filename plus a native `<audio controls src={src}>` element — playback still works even when waveform generation fails.

### `EventAttachments` component (new, read-only)

`apps/web/src/components/ui/event-calendar/event-attachments.tsx` — separate from the existing editable `event-file-attachments.tsx` (which keeps upload/delete for the edit dialog). Queries `getEventFilesQueryOptions({ eventId })`:

- `kind === "audio"` → `<AudioPlayer src={file.downloadUrl} filename={file.originalFilename} />`
- other kinds → plain filename row, no controls

### `EventDetail` integration

`apps/web/src/components/ui/event-calendar/event-detail.tsx` renders `<EventAttachments eventId={event.id} />` alongside the existing content. `event.id` is already available on `CalendarEvent`; no new prop threading required in either route (`/calendar/$eventId` or `/organizations/$organizationSlug/calendar/$eventId`).

## Testing

- `packages/modules/src/file/app/list-event-files.test.ts`: update to assert `downloadUrl` is present, using a fake `S3StoragePort`.
- `audio-player.test.tsx`: mock `fetch` and `AudioContext.decodeAudioData`; assert play/pause toggling, seek-on-click, and the fetch/decode-failure fallback path.
- `event-attachments.test.tsx`: mock the query; assert audio files render `AudioPlayer` and non-audio files render a plain row.
- Storybook story for `AudioPlayer` with a pre-mocked decoded waveform (no real network fetch in Storybook).

## Out of scope

- Trimming, zoom, export (full waveform editor).
- Playback controls in the edit dialog's `EventFileAttachments` (upload/delete list stays as-is).
- Filtering non-audio files out of the EventDetail list (they still appear, just without a preview).
