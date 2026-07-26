# Event Image/Video Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give image and video attachments on the event detail page a thumbnail-grid gallery with a click-to-expand lightbox, replacing the current plain-filename row (video shows a placeholder icon only — no player).

**Architecture:** A new presentational `EventGallery` component (grid + `Dialog`-based lightbox with prev/next) is fed a filtered file list by `EventAttachments`, which now splits its already-fetched files into an `audioFiles` bucket (existing `AudioPlayer` behavior, unchanged) and a `galleryFiles` bucket (`image` + `video` kinds). No backend or tRPC changes.

**Tech Stack:** React 18, TypeScript, `@tanstack/react-query`, existing `Dialog`/`Button` from `@/components/ui`, `lucide-react` icons, `react-i18next`, Vitest + React Testing Library, Storybook.

## Global Constraints

- `FileKind` is exactly `"audio" | "video" | "image"` (`packages/modules/src/file/domain/index.ts`) — every kind must be explicitly handled; no fallback branch.
- No backend/API changes — `EventFile.kind` and `.downloadUrl` (from `apps/web/src/services/resources/file.ts`) already carry everything needed.
- No real video playback — video files get a static icon placeholder in both the grid and the lightbox, never a `<video>` element.
- All user-visible strings must be translated: add new keys to both `packages/i18n/locales/en.json` and `packages/i18n/locales/fr.json` under the `calendar` namespace, and read them via `useTranslation("calendar")` — never hardcode display text.
- Follow the existing flat co-located file pattern used by `audio-player.tsx` (component + `.stories.tsx` + `.test.tsx` in the same directory, no per-component folder, no separate `index.ts`).
- Components under `apps/web/src/components/ui/` are presentational — `EventGallery` takes `files` as a prop, no data fetching inside it (matches `AudioPlayer`).

---

### Task 1: `EventGallery` component

**Files:**
- Create: `apps/web/src/components/ui/event-gallery.tsx`
- Create: `apps/web/src/components/ui/event-gallery.stories.tsx`
- Test: `apps/web/src/components/ui/event-gallery.test.tsx`
- Modify: `packages/i18n/locales/en.json` (add `"Gallery"`, `"Previous"`, `"Next"` to the `calendar` namespace)
- Modify: `packages/i18n/locales/fr.json` (same keys, French translations)

**Interfaces:**
- Consumes: `EventFile` type from `apps/web/src/services/resources/file.ts` — `{ id: string; kind: "audio" | "video" | "image"; originalFilename: string; downloadUrl: string }`.
- Consumes: `Dialog`, `DialogContent`, `DialogTitle` from `apps/web/src/components/ui/dialog.tsx`; `Button` from `apps/web/src/components/ui/button.tsx` (supports `size="icon-sm"`); `ChevronLeft`, `ChevronRight`, `Video` from `lucide-react`.
- Produces: `export interface EventGalleryProps { files: EventFile[] }` and `export function EventGallery({ files }: EventGalleryProps)` — consumed by Task 2.

- [ ] **Step 1: Add the new i18n keys**

In `packages/i18n/locales/en.json`, find this block (around line 254):

```json
    "Delete this file?": "Delete this file?",
    "This will permanently delete the file. This action cannot be undone."
  },
```

Replace it with:

```json
    "Delete this file?": "Delete this file?",
    "This will permanently delete the file. This action cannot be undone.": "This will permanently delete the file. This action cannot be undone.",
    "Gallery": "Gallery",
    "Previous": "Previous",
    "Next": "Next"
  },
```

In `packages/i18n/locales/fr.json`, find this block (around line 255):

```json
    "Delete this file?": "Supprimer ce fichier ?",
    "This will permanently delete the file. This action cannot be undone.": "Cette action supprimera définitivement le fichier. Cette action est irréversible."
  },
```

Replace it with:

```json
    "Delete this file?": "Supprimer ce fichier ?",
    "This will permanently delete the file. This action cannot be undone.": "Cette action supprimera définitivement le fichier. Cette action est irréversible.",
    "Gallery": "Galerie",
    "Previous": "Précédent",
    "Next": "Suivant"
  },
```

- [ ] **Step 2: Write the failing test**

Create `apps/web/src/components/ui/event-gallery.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { EventGallery } from "./event-gallery"
import type { EventFile } from "@/services/resources/file"

const files: EventFile[] = [
  {
    id: "file-1",
    kind: "image",
    originalFilename: "cover.png",
    downloadUrl: "https://example.com/cover.png",
  } as EventFile,
  {
    id: "file-2",
    kind: "video",
    originalFilename: "clip.mp4",
    downloadUrl: "https://example.com/clip.mp4",
  } as EventFile,
  {
    id: "file-3",
    kind: "image",
    originalFilename: "poster.jpg",
    downloadUrl: "https://example.com/poster.jpg",
  } as EventFile,
]

describe("EventGallery", () => {
  it("renders an image thumbnail for image files and an icon placeholder for video files", () => {
    render(<EventGallery files={files} />)

    const imageTile = screen.getByRole("button", { name: "cover.png" })
    expect(imageTile.querySelector("img")).not.toBeNull()

    const videoTile = screen.getByRole("button", { name: "clip.mp4" })
    expect(videoTile.querySelector("img")).toBeNull()
    expect(videoTile.querySelector("svg")).not.toBeNull()
  })

  it("opens the lightbox with the clicked item selected", async () => {
    const user = userEvent.setup()
    render(<EventGallery files={files} />)

    await user.click(screen.getByRole("button", { name: "clip.mp4" }))

    expect(screen.getByRole("dialog", { name: "clip.mp4" })).toBeInTheDocument()
  })

  it("moves to the next and previous item without closing the dialog", async () => {
    const user = userEvent.setup()
    render(<EventGallery files={files} />)

    await user.click(screen.getByRole("button", { name: "cover.png" }))
    expect(screen.getByRole("dialog", { name: "cover.png" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(screen.getByRole("dialog", { name: "clip.mp4" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Previous" }))
    expect(screen.getByRole("dialog", { name: "cover.png" })).toBeInTheDocument()
  })

  it("hides the next button on the last item", async () => {
    const user = userEvent.setup()
    render(<EventGallery files={files} />)

    await user.click(screen.getByRole("button", { name: "poster.jpg" }))

    expect(screen.getByRole("dialog", { name: "poster.jpg" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument()
  })

  it("shows the right item after closing the lightbox and opening a different tile", async () => {
    const user = userEvent.setup()
    render(<EventGallery files={files} />)

    await user.click(screen.getByRole("button", { name: "cover.png" }))
    expect(screen.getByRole("dialog", { name: "cover.png" })).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "poster.jpg" }))
    expect(screen.getByRole("dialog", { name: "poster.jpg" })).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter web test -- event-gallery.test.tsx`
Expected: FAIL — `Cannot find module './event-gallery'` (the component doesn't exist yet).

- [ ] **Step 4: Write the `EventGallery` component**

Create `apps/web/src/components/ui/event-gallery.tsx`:

```tsx
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { EventFile } from "@/services/resources/file"

export interface EventGalleryProps {
  files: EventFile[]
}

export function EventGallery({ files }: EventGalleryProps) {
  const { t } = useTranslation("calendar")
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const selected = selectedIndex !== null ? files[selectedIndex] : undefined

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-medium text-muted-foreground">{t("Gallery")}</h3>

      <div className="grid grid-cols-3 gap-2">
        {files.map((file, index) => (
          <button
            key={file.id}
            type="button"
            aria-label={file.originalFilename}
            onClick={() => setSelectedIndex(index)}
            className="aspect-square overflow-hidden rounded-md bg-muted"
          >
            {file.kind === "image" ? (
              <img src={file.downloadUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Video className="size-6 text-muted-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>

      <Dialog
        open={selected !== undefined}
        onOpenChange={(open) => {
          if (!open) setSelectedIndex(null)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogTitle className="sr-only">{selected?.originalFilename}</DialogTitle>
          {selected && selectedIndex !== null && (
            <div className="relative flex items-center justify-center">
              {selectedIndex > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute left-0"
                  aria-label={t("Previous")}
                  onClick={() => setSelectedIndex(selectedIndex - 1)}
                >
                  <ChevronLeft />
                </Button>
              )}

              {selected.kind === "image" ? (
                <img
                  src={selected.downloadUrl}
                  alt=""
                  className="max-h-[70vh] w-full object-contain"
                />
              ) : (
                <div className="flex h-64 w-full items-center justify-center rounded-md bg-muted">
                  <Video className="size-12 text-muted-foreground" />
                </div>
              )}

              {selectedIndex < files.length - 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-0"
                  aria-label={t("Next")}
                  onClick={() => setSelectedIndex(selectedIndex + 1)}
                >
                  <ChevronRight />
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter web test -- event-gallery.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 6: Add the Storybook story**

Create `apps/web/src/components/ui/event-gallery.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react"
import { EventGallery } from "./event-gallery"
import type { EventFile } from "@/services/resources/file"

const files: EventFile[] = [
  {
    id: "file-1",
    kind: "image",
    originalFilename: "cover.png",
    downloadUrl: "https://example.com/cover.png",
  } as EventFile,
  {
    id: "file-2",
    kind: "video",
    originalFilename: "clip.mp4",
    downloadUrl: "https://example.com/clip.mp4",
  } as EventFile,
  {
    id: "file-3",
    kind: "image",
    originalFilename: "poster.jpg",
    downloadUrl: "https://example.com/poster.jpg",
  } as EventFile,
]

const meta = {
  title: "UI/EventGallery",
  component: EventGallery,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EventGallery>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { files },
}
```

- [ ] **Step 7: Typecheck and lint**

Run: `pnpm --filter web typecheck && pnpm --filter web lint`
Expected: no errors in the three new/modified files.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/ui/event-gallery.tsx apps/web/src/components/ui/event-gallery.stories.tsx apps/web/src/components/ui/event-gallery.test.tsx packages/i18n/locales/en.json packages/i18n/locales/fr.json
git commit -m "feat(web): add EventGallery component for image/video attachments"
```

---

### Task 2: Wire `EventGallery` into `EventAttachments`

**Files:**
- Modify: `apps/web/src/components/ui/event-calendar/event-attachments.tsx`
- Modify: `apps/web/src/components/ui/event-calendar/event-attachments.test.tsx`
- Modify: `apps/web/src/components/ui/event-calendar/event-attachments.stories.tsx`

**Interfaces:**
- Consumes: `EventGallery` and `EventGalleryProps` from Task 1 (`@/components/ui/event-gallery`).
- No change to `EventAttachmentsProps` (`{ eventId: string }`).

- [ ] **Step 1: Update the failing/changed tests first**

Replace the full contents of `apps/web/src/components/ui/event-calendar/event-attachments.test.tsx` with:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { EventAttachments } from "./event-attachments"
import * as fileResource from "@/services/resources/file"

vi.mock("@/components/ui/audio-player", () => ({
  AudioPlayer: ({ filename }: { filename: string }) => <div>Player: {filename}</div>,
}))

vi.mock("@/components/ui/event-gallery", () => ({
  EventGallery: ({ files }: { files: fileResource.EventFile[] }) => (
    <div>Gallery: {files.map((file) => file.originalFilename).join(", ")}</div>
  ),
}))

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe("EventAttachments", () => {
  beforeEach(() => {
    vi.spyOn(fileResource, "getEventFilesQueryOptions").mockReturnValue({
      queryKey: ["file", "listEventFiles"],
      queryFn: async () => [],
    } as never)
  })

  it("renders nothing when there are no files", () => {
    const { container } = renderWithClient(<EventAttachments eventId="event-1" />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders an AudioPlayer for audio files", async () => {
    vi.spyOn(fileResource, "getEventFilesQueryOptions").mockReturnValue({
      queryKey: ["file", "listEventFiles"],
      queryFn: async () => [
        {
          id: "file-1",
          kind: "audio",
          originalFilename: "demo.mp3",
          downloadUrl: "https://example.com/demo.mp3",
        } as fileResource.EventFile,
      ],
    } as never)

    renderWithClient(<EventAttachments eventId="event-1" />)
    expect(await screen.findByText("Player: demo.mp3")).toBeInTheDocument()
  })

  it("renders image and video files in the EventGallery", async () => {
    vi.spyOn(fileResource, "getEventFilesQueryOptions").mockReturnValue({
      queryKey: ["file", "listEventFiles"],
      queryFn: async () => [
        {
          id: "file-2",
          kind: "image",
          originalFilename: "cover.png",
          downloadUrl: "https://example.com/cover.png",
        } as fileResource.EventFile,
        {
          id: "file-3",
          kind: "video",
          originalFilename: "clip.mp4",
          downloadUrl: "https://example.com/clip.mp4",
        } as fileResource.EventFile,
      ],
    } as never)

    renderWithClient(<EventAttachments eventId="event-1" />)
    expect(await screen.findByText("Gallery: cover.png, clip.mp4")).toBeInTheDocument()
    expect(screen.queryByText(/^Player:/)).not.toBeInTheDocument()
  })

  it("renders both sections when audio and image files are mixed", async () => {
    vi.spyOn(fileResource, "getEventFilesQueryOptions").mockReturnValue({
      queryKey: ["file", "listEventFiles"],
      queryFn: async () => [
        {
          id: "file-1",
          kind: "audio",
          originalFilename: "demo.mp3",
          downloadUrl: "https://example.com/demo.mp3",
        } as fileResource.EventFile,
        {
          id: "file-2",
          kind: "image",
          originalFilename: "cover.png",
          downloadUrl: "https://example.com/cover.png",
        } as fileResource.EventFile,
      ],
    } as never)

    renderWithClient(<EventAttachments eventId="event-1" />)
    expect(await screen.findByText("Player: demo.mp3")).toBeInTheDocument()
    expect(await screen.findByText("Gallery: cover.png")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter web test -- event-attachments.test.tsx`
Expected: FAIL — the `"renders image and video files in the EventGallery"` and `"renders both sections..."` cases fail because `EventAttachments` still renders plain filename text, not `EventGallery`.

- [ ] **Step 3: Update the `EventAttachments` component**

Replace the full contents of `apps/web/src/components/ui/event-calendar/event-attachments.tsx` with:

```tsx
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { AudioPlayer } from "@/components/ui/audio-player"
import { EventGallery } from "@/components/ui/event-gallery"
import { getEventFilesQueryOptions } from "@/services/resources/file"

export interface EventAttachmentsProps {
  eventId: string
}

export function EventAttachments({ eventId }: EventAttachmentsProps) {
  const { t } = useTranslation("calendar")
  const { data: files = [] } = useQuery(getEventFilesQueryOptions({ eventId }))

  if (files.length === 0) return null

  const audioFiles = files.filter((file) => file.kind === "audio")
  const galleryFiles = files.filter((file) => file.kind === "image" || file.kind === "video")

  return (
    <div className="flex flex-col gap-4">
      {audioFiles.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">{t("Attachments")}</h3>
          <ul className="flex flex-col gap-2">
            {audioFiles.map((file) => (
              <li key={file.id} className="text-xs">
                <AudioPlayer src={file.downloadUrl} filename={file.originalFilename} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {galleryFiles.length > 0 && <EventGallery files={galleryFiles} />}
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter web test -- event-attachments.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Update the Storybook story to demonstrate all three kinds together**

In `apps/web/src/components/ui/event-calendar/event-attachments.stories.tsx`, replace the `WithMixedFiles` story's file array:

```tsx
export const WithMixedFiles: Story = {
  args: { eventId: "event-1" },
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={withSeededFiles([
          {
            id: "file-1",
            kind: "audio",
            originalFilename: "demo.mp3",
            downloadUrl: "https://example.com/demo.mp3",
          } as EventFile,
          {
            id: "file-2",
            kind: "image",
            originalFilename: "cover.png",
            downloadUrl: "https://example.com/cover.png",
          } as EventFile,
          {
            id: "file-3",
            kind: "video",
            originalFilename: "clip.mp4",
            downloadUrl: "https://example.com/clip.mp4",
          } as EventFile,
        ])}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
}
```

- [ ] **Step 6: Typecheck and lint**

Run: `pnpm --filter web typecheck && pnpm --filter web lint`
Expected: no errors.

- [ ] **Step 7: Run the full web test suite**

Run: `pnpm --filter web test`
Expected: all tests PASS, including the updated `event-attachments.test.tsx` and new `event-gallery.test.tsx`.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/ui/event-calendar/event-attachments.tsx apps/web/src/components/ui/event-calendar/event-attachments.test.tsx apps/web/src/components/ui/event-calendar/event-attachments.stories.tsx
git commit -m "feat(web): show image/video gallery in event attachments"
```
