# Event Image/Video Gallery — Design

Date: 2026-07-26

## Goal

On the event details page, `EventAttachments` currently renders audio files with `AudioPlayer` and every other kind (`image`, `video`) as a plain filename row with no preview (explicitly called out as out of scope in the prior audio-playback spec). Give images and videos a proper gallery: a thumbnail grid with a click-to-expand lightbox. No video player yet — videos show a placeholder icon in both the grid and the lightbox.

## Scope

- Read-only. No upload/delete here (unchanged — `EventFileAttachments` in the edit dialog keeps that).
- `FileKind` is exactly `"audio" | "video" | "image"` (`packages/modules/src/file/domain/index.ts`), so after this change every kind is explicitly handled in `EventAttachments` — the old plain-filename fallback branch is removed rather than left as dead code.
- Images render the real file (`<img>` via `downloadUrl`). Videos render a static icon placeholder only — no `<video>` element, no thumbnail generation.
- No backend/API changes. `EventFile.kind` and `downloadUrl` (added in the audio-playback feature) already carry everything the gallery needs.

## Frontend changes

### `EventGallery` component (new)

`apps/web/src/components/ui/event-gallery.tsx` + co-located `event-gallery.stories.tsx` and `event-gallery.test.tsx` (flat file layout, matching `audio-player.tsx` — no per-component folder, no data fetching inside the component).

```ts
export interface EventGalleryProps {
  files: EventFile[] // kind is "image" | "video" for every item
}
```

Behavior:
1. Renders a `grid grid-cols-3 gap-2` of square tiles under a "Gallery" heading (`text-xs font-medium text-muted-foreground`, same style as the existing "Attachments" heading).
2. Image tile: `<img src={file.downloadUrl} alt={file.originalFilename} className="h-full w-full object-cover" />`.
3. Video tile: a muted (`bg-muted`) square with a centered lucide `Video` icon — no filename caption on the tile.
4. Each tile is a `<button>`; clicking it sets local state `selectedIndex` and opens a `Dialog` (existing `apps/web/src/components/ui/dialog.tsx`) as a lightbox.
5. Lightbox content: image renders larger via `object-contain` (`max-h-[70vh]`); video renders the same icon placeholder, larger. A visually-hidden (`sr-only`) `DialogTitle` carries `file.originalFilename` for screen readers — Radix requires a title; this doesn't add visible caption text, keeping the "icon only" look.
6. Prev/Next: `Button variant="ghost" size="icon-sm"` with `ChevronLeft`/`ChevronRight`, absolutely positioned at the lightbox edges. Hidden (not just disabled) at the first/last item respectively. Clicking moves `selectedIndex` by ±1 without closing the dialog.
7. Closing the dialog (overlay click, Esc, close button) resets `selectedIndex` to `null`.
8. No custom broken-image handling — a broken `downloadUrl` falls back to the browser's native broken-image rendering (same level of effort as the rest of this read-only view; `AudioPlayer`'s explicit error state exists because decoding can fail, which doesn't apply to a plain `<img>`).

### `EventAttachments` component (modified)

`apps/web/src/components/ui/event-calendar/event-attachments.tsx` splits the single fetched `files` list into two buckets instead of rendering one mixed list:

```ts
const audioFiles = files.filter((f) => f.kind === "audio")
const galleryFiles = files.filter((f) => f.kind === "image" || f.kind === "video")
```

- `audioFiles.length > 0` → existing "Attachments" heading + `<ul>` of `AudioPlayer` rows (unchanged).
- `galleryFiles.length > 0` → renders `<EventGallery files={galleryFiles} />` (own "Gallery" heading, defined inside `EventGallery` itself).
- `files.length === 0` → `return null` (unchanged top-level guard).
- The old `<span className="truncate">{file.originalFilename}</span>` fallback branch is deleted — every kind is now handled by one of the two sections above.

### `EventDetail` integration

No change — `EventAttachments` is already rendered from `event-detail.tsx:83`; this is purely an internal refactor of what it renders.

## i18n

New strings added to `packages/i18n/locales/en.json` and `fr.json` under the `calendar` namespace: `"Gallery"`, `"Previous"`, `"Next"`.

## Testing

- `event-gallery.test.tsx`: grid renders an `<img>` for image-kind files and an icon tile for video-kind files; clicking a tile opens the dialog with the right item selected; Prev/Next move the selection and are absent at the respective boundary; closing the dialog and reopening a different tile shows the right item.
- `event-attachments.test.tsx`: update existing cases — audio-only files still render `AudioPlayer` rows; image/video files render inside `EventGallery` instead of a plain filename row; mixed audio + image/video shows both sections.
- Storybook story for `EventGallery` with a mix of image and video files (static `downloadUrl` values, no real network fetch needed since images just point at story-time URLs and video is a placeholder).

## Out of scope

- Actual video playback (a real `<video>` element / player) — explicitly deferred, placeholder only.
- Video thumbnail/poster-frame generation.
- Upload/delete/reordering (stays in `EventFileAttachments`).
- Keyboard (arrow key) navigation in the lightbox — button-only for this iteration.
