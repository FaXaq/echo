# Decouple Event Details Modal From Attachment Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move attachment upload/delete out of the event edit modal (`EventDialog`) and unify it with the read-only attachment display already on the event details page (`EventDetail`), so the modal only edits event fields and the page is the single place to view and manage attachments.

**Architecture:** `EventGallery` gains an optional `onDelete` callback so gallery thumbnails can be deleted in place. `EventAttachments` (already mounted in `EventDetail`) absorbs `EventFileAttachments`'s upload/delete logic, rendering one unified section (upload dropzone + audio list with delete + gallery with delete) instead of two separate read-only/editable displays. `EventDialog` drops all attachment UI and its now-unused `organizationId` prop. `EventFileAttachments` is deleted.

**Tech Stack:** React 18, TanStack Router, `@tanstack/react-query` (`useSuspenseQuery`, `useMutation`), Vitest + React Testing Library + `@testing-library/user-event`, react-i18next, Tailwind CSS v4, shadcn/ui (`AlertDialog`, `Dialog`, `Button`), lucide-react icons.

## Global Constraints

- All user-visible strings must go through `t()` / `<Trans t={t}>`, namespace `"calendar"` (see `AGENTS.md` translation rules). Every new translatable string used with `t(...)` must be the literal English source string (e.g. `t("Delete {{filename}}", { filename: file.originalFilename })`), never a dot-notation key.
- `apps/web/src/components/ui/*` and `apps/web/src/components/event-calendar/*` files must stay consistent with the existing pattern already in this codebase: presentational components here already import sibling data-fetching components directly (e.g. `EventDetail` already imports `EventAttachments`), so this plan follows that precedent rather than introducing a new one.
- No backend/tRPC changes — `apps/api/src/router/file.ts` and `apps/web/src/services/resources/file.ts` are unchanged.
- Run `pnpm --filter @echo/web test -- <path>` to run a single test file, `pnpm test:web` for the whole web test suite, `pnpm --filter @echo/web typecheck` for type checking.

---

### Task 1: `EventGallery` gains per-thumbnail delete

**Files:**
- Modify: `apps/web/src/components/ui/event-gallery.tsx`
- Test: `apps/web/src/components/ui/event-gallery.test.tsx`

**Interfaces:**
- Produces: `EventGalleryProps.onDelete?: (file: EventFile) => void`. When provided, each grid thumbnail renders a delete icon button (accessible name `t("Delete {{filename}}", { filename: file.originalFilename })`) that opens an `AlertDialog` confirm ("Delete this file?" / "This will permanently delete the file. This action cannot be undone.") and calls `onDelete(file)` when the user confirms. When `onDelete` is omitted, no delete affordance renders (current behavior, unchanged).

- [ ] **Step 1: Write the failing tests**

Add to `apps/web/src/components/ui/event-gallery.test.tsx` (append inside the existing `describe("EventGallery", ...)` block, after the last `it`):

```tsx
  it("does not render a delete button when onDelete is not provided", () => {
    render(<EventGallery files={files} />)

    expect(
      screen.queryByRole("button", { name: "Delete cover.png" })
    ).not.toBeInTheDocument()
  })

  it("calls onDelete with the file after confirming deletion", async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<EventGallery files={files} onDelete={onDelete} />)

    await user.click(screen.getByRole("button", { name: "Delete cover.png" }))
    const confirmDialog = await screen.findByRole("alertdialog")
    await user.click(within(confirmDialog).getByRole("button", { name: "Delete" }))

    expect(onDelete).toHaveBeenCalledWith(files[0])
  })

  it("does not open the lightbox when clicking the delete button", async () => {
    const user = userEvent.setup()
    render(<EventGallery files={files} onDelete={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: "Delete cover.png" }))

    expect(screen.queryByRole("dialog", { name: "cover.png" })).not.toBeInTheDocument()
  })
```

Update the test file's imports at the top to add `vi` and `within`:

```tsx
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @echo/web test -- src/components/ui/event-gallery.test.tsx`
Expected: FAIL — 3 new tests fail because `EventGallery` doesn't accept/render `onDelete` yet (`getByRole("button", { name: "Delete cover.png" })` finds nothing).

- [ ] **Step 3: Implement `onDelete` support**

Replace the full contents of `apps/web/src/components/ui/event-gallery.tsx`:

```tsx
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight, Video, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { EventFile } from "@/services/resources/file"

export interface EventGalleryProps {
  files: EventFile[]
  onDelete?: (file: EventFile) => void
}

export function EventGallery({ files, onDelete }: EventGalleryProps) {
  const { t } = useTranslation("calendar")
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const selected = selectedIndex !== null ? files[selectedIndex] : undefined

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-medium text-muted-foreground">{t("Gallery")}</h3>

      <div className="grid grid-cols-3 gap-2">
        {files.map((file, index) => (
          <div
            key={file.id}
            className="group relative aspect-square overflow-hidden rounded-md bg-muted"
          >
            <button
              type="button"
              aria-label={file.originalFilename}
              onClick={() => setSelectedIndex(index)}
              className="h-full w-full"
            >
              {file.kind === "image" ? (
                <img src={file.downloadUrl} alt="" className="h-full w-full object-cover" />
              ) : file.kind === "video" ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Video className="size-6 text-muted-foreground" />
                </div>
              ) : null}
            </button>

            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={t("Delete {{filename}}", { filename: file.originalFilename })}
                    className="absolute right-1 top-1 opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <X className="size-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("Delete this file?")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t(
                        "This will permanently delete the file. This action cannot be undone."
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(file)}>
                      {t("Delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
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
              ) : selected.kind === "video" ? (
                <div className="flex h-64 w-full items-center justify-center rounded-md bg-muted">
                  <Video className="size-12 text-muted-foreground" />
                </div>
              ) : null}

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

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @echo/web test -- src/components/ui/event-gallery.test.tsx`
Expected: PASS — all tests (existing + 3 new) pass.

- [ ] **Step 5: Add the new English strings to the locale file**

Open `packages/i18n/locales/en.json`. Under the `"calendar"` namespace, the existing `"Uploaded by {{name}}"` key follows this identity-translation pattern for keys containing dynamic values from this feature. Add, in the same namespace object:

```json
"Delete {{filename}}": "Delete {{filename}}"
```

(Leave `fr.json` untouched if there is no existing French translation workflow step in this task — adding the identity English entry is what makes `en` resolve; a translator fills in `fr.json` separately. Check `packages/i18n/locales/fr.json` for the `"calendar"` namespace: if it already mirrors every other key from `en.json` 1:1, add the same key there too with an appropriate French value, e.g. `"Delete {{filename}}": "Supprimer {{filename}}"`, to keep the two locale files structurally in sync.)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/ui/event-gallery.tsx apps/web/src/components/ui/event-gallery.test.tsx packages/i18n/locales/en.json packages/i18n/locales/fr.json
git commit -m "feat(web): add per-thumbnail delete to EventGallery"
```

---

### Task 2: Unify `EventAttachments` (upload + delete + display), delete `EventFileAttachments`

**Files:**
- Modify: `apps/web/src/components/event-calendar/event-attachments.tsx`
- Modify: `apps/web/src/components/event-calendar/event-attachments.test.tsx`
- Delete: `apps/web/src/components/event-calendar/event-file-attachments.tsx`
- Delete: `apps/web/src/components/event-calendar/event-file-attachments.test.tsx`

**Interfaces:**
- Consumes: `EventGalleryProps.onDelete?: (file: EventFile) => void` (Task 1). `useUploadFileMutation()`, `useDeleteFileMutation()`, `getEventFilesQueryOptions({ eventId })`, `type EventFile` from `@/services/resources/file` (unchanged, already exist).
- Produces: `EventAttachmentsProps` gains `organizationId?: string` (used by Task 4). `EventAttachments` is now the only attachment component — `EventFileAttachments` no longer exists.

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `apps/web/src/components/event-calendar/event-attachments.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { EventAttachments } from "./event-attachments"
import * as fileResource from "@/services/resources/file"

vi.mock("@/components/ui/audio-player", () => ({
  AudioPlayer: ({ filename }: { filename: string }) => <div>Player: {filename}</div>,
}))

vi.mock("@/components/ui/event-gallery", () => ({
  EventGallery: ({
    files,
    onDelete,
  }: {
    files: fileResource.EventFile[]
    onDelete?: (file: fileResource.EventFile) => void
  }) => (
    <div>
      Gallery: {files.map((file) => file.originalFilename).join(", ")}
      {onDelete &&
        files.map((file) => (
          <button key={file.id} onClick={() => onDelete(file)}>
            Delete {file.originalFilename}
          </button>
        ))}
    </div>
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

  it("renders the upload dropzone even when there are no files", async () => {
    renderWithClient(<EventAttachments eventId="event-1" />)
    expect(await screen.findByLabelText("Add files")).toBeInTheDocument()
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
          uploadedBy: "Alex",
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
          uploadedBy: "Alex",
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

  it("uploads a picked file via useUploadFileMutation, including organizationId", async () => {
    const mutateSpy = vi.fn()
    vi.spyOn(fileResource, "useUploadFileMutation").mockReturnValue({
      mutate: mutateSpy,
      isPending: false,
      isError: false,
    } as never)
    vi.spyOn(fileResource, "useDeleteFileMutation").mockReturnValue({
      mutate: vi.fn(),
    } as never)

    const user = userEvent.setup()
    renderWithClient(<EventAttachments eventId="event-1" organizationId="org-1" />)

    const input = await screen.findByLabelText("Add files", { selector: "input" })
    const file = new File(["x"], "demo.mp3", { type: "audio/mpeg" })
    await user.upload(input, file)

    expect(mutateSpy).toHaveBeenCalledWith({ eventId: "event-1", organizationId: "org-1", file })
  })

  it("shows the specific server error message when upload fails", async () => {
    vi.spyOn(fileResource, "useUploadFileMutation").mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error("File is too large"),
    } as never)
    vi.spyOn(fileResource, "useDeleteFileMutation").mockReturnValue({
      mutate: vi.fn(),
    } as never)

    renderWithClient(<EventAttachments eventId="event-1" />)

    expect(await screen.findByText("File is too large")).toBeInTheDocument()
    expect(screen.queryByText("Upload failed")).not.toBeInTheDocument()
  })

  it("requests deletion via useDeleteFileMutation when confirming delete on an audio file", async () => {
    vi.spyOn(fileResource, "getEventFilesQueryOptions").mockReturnValue({
      queryKey: ["file", "listEventFiles"],
      queryFn: async () => [
        {
          id: "file-1",
          kind: "audio",
          originalFilename: "demo.mp3",
          downloadUrl: "https://example.com/demo.mp3",
          uploadedBy: "Alex",
        } as fileResource.EventFile,
      ],
    } as never)
    const deleteSpy = vi.fn()
    vi.spyOn(fileResource, "useUploadFileMutation").mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as never)
    vi.spyOn(fileResource, "useDeleteFileMutation").mockReturnValue({
      mutate: deleteSpy,
    } as never)

    const user = userEvent.setup()
    renderWithClient(<EventAttachments eventId="event-1" />)

    await screen.findByText("Player: demo.mp3")
    await user.click(screen.getByRole("button", { name: "Delete demo.mp3" }))
    const confirmDialog = await screen.findByRole("alertdialog")
    await user.click(within(confirmDialog).getByRole("button", { name: "Delete" }))

    expect(deleteSpy).toHaveBeenCalledWith({ id: "file-1" })
  })

  it("requests deletion via useDeleteFileMutation when the gallery reports a delete", async () => {
    vi.spyOn(fileResource, "getEventFilesQueryOptions").mockReturnValue({
      queryKey: ["file", "listEventFiles"],
      queryFn: async () => [
        {
          id: "file-2",
          kind: "image",
          originalFilename: "cover.png",
          downloadUrl: "https://example.com/cover.png",
        } as fileResource.EventFile,
      ],
    } as never)
    const deleteSpy = vi.fn()
    vi.spyOn(fileResource, "useUploadFileMutation").mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as never)
    vi.spyOn(fileResource, "useDeleteFileMutation").mockReturnValue({
      mutate: deleteSpy,
    } as never)

    const user = userEvent.setup()
    renderWithClient(<EventAttachments eventId="event-1" />)

    await user.click(await screen.findByText("Delete cover.png"))

    expect(deleteSpy).toHaveBeenCalledWith({ id: "file-2" })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @echo/web test -- src/components/event-calendar/event-attachments.test.tsx`
Expected: FAIL — no upload dropzone rendered yet, no delete buttons, `EventGallery` mock's `onDelete` never invoked because the real component doesn't pass it, `organizationId` prop doesn't exist.

- [ ] **Step 3: Implement the unified component**

Replace the full contents of `apps/web/src/components/event-calendar/event-attachments.tsx`:

```tsx
import { Suspense } from "react"
import { useTranslation } from "react-i18next"
import { useSuspenseQuery } from "@tanstack/react-query"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AudioPlayer } from "@/components/ui/audio-player"
import { Button } from "@/components/ui/button"
import { EventGallery } from "@/components/ui/event-gallery"
import { FileUpload } from "@/components/ui/file-upload"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getEventFilesQueryOptions,
  useDeleteFileMutation,
  useUploadFileMutation,
  type EventFile,
} from "@/services/resources/file"

export interface EventAttachmentsProps {
  eventId: string
  organizationId?: string
}

function DeleteFileButton({ file, onConfirm }: { file: EventFile; onConfirm: () => void }) {
  const { t } = useTranslation("calendar")

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={t("Delete {{filename}}", { filename: file.originalFilename })}
        >
          ×
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Delete this file?")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("This will permanently delete the file. This action cannot be undone.")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{t("Delete")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function EventAttachmentsSuspended({ eventId, organizationId }: EventAttachmentsProps) {
  const { t } = useTranslation("calendar")
  const { data: files = [] } = useSuspenseQuery(getEventFilesQueryOptions({ eventId }))
  const uploadMutation = useUploadFileMutation()
  const deleteMutation = useDeleteFileMutation()

  const audioFiles = files.filter((file) => file.kind === "audio")
  const galleryFiles = files.filter((file) => file.kind === "image" || file.kind === "video")

  const handleFilesSelected = (selected: File[]) => {
    selected.forEach((file) => {
      uploadMutation.mutate({ eventId, organizationId, file })
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <FileUpload
        accept="audio/*,video/*,image/*"
        onFilesSelected={handleFilesSelected}
        disabled={uploadMutation.isPending}
      />
      {uploadMutation.isError && (
        <p className="text-xs text-destructive">
          {t(
            uploadMutation.error instanceof Error && uploadMutation.error.message
              ? uploadMutation.error.message
              : "Upload failed"
          )}
        </p>
      )}

      {audioFiles.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">{t("Attachments")}</h3>
          <ul className="flex flex-col gap-2">
            {audioFiles.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-2 text-xs">
                <div>
                  <AudioPlayer src={file.downloadUrl} filename={file.originalFilename} />
                  <p>{file.originalFilename}</p>
                  <p>{t("Uploaded by {{name}}", { name: file.uploadedBy })}</p>
                </div>
                <DeleteFileButton
                  file={file}
                  onConfirm={() => deleteMutation.mutate({ id: file.id })}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {galleryFiles.length > 0 && (
        <EventGallery
          files={galleryFiles}
          onDelete={(file) => deleteMutation.mutate({ id: file.id })}
        />
      )}
    </div>
  )
}

function EventAttachmentsLoader() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  )
}

export function EventAttachments({ eventId, organizationId }: EventAttachmentsProps) {
  return (
    <Suspense fallback={<EventAttachmentsLoader />}>
      <EventAttachmentsSuspended eventId={eventId} organizationId={organizationId} />
    </Suspense>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @echo/web test -- src/components/event-calendar/event-attachments.test.tsx`
Expected: PASS — all tests pass.

- [ ] **Step 5: Delete the now-merged `EventFileAttachments` component and its test**

```bash
git rm apps/web/src/components/event-calendar/event-file-attachments.tsx apps/web/src/components/event-calendar/event-file-attachments.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/event-calendar/event-attachments.tsx apps/web/src/components/event-calendar/event-attachments.test.tsx
git commit -m "feat(web): unify attachment upload/delete into EventAttachments"
```

(The `git rm` in Step 5 stages the deletions; they'll be included in this commit alongside the `git add`.)

---

### Task 3: Strip attachment UI out of `EventDialog`

**Files:**
- Modify: `apps/web/src/components/ui/event-calendar/event-dialog.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `EventDialogProps` no longer has `organizationId`. Callers (Task 5) must stop passing it.

There is no dedicated test file for `event-dialog.tsx` today (verified: no `event-dialog.test.tsx` exists), so this task is verified via typecheck and the full web test suite rather than a new unit test — this is a pure deletion of dead UI, not new behavior.

- [ ] **Step 1: Remove the import**

In `apps/web/src/components/ui/event-calendar/event-dialog.tsx`, delete this line (currently line 48):

```tsx
import { EventFileAttachments } from "@/components/event-calendar/event-file-attachments"
```

- [ ] **Step 2: Remove `organizationId` from the props interface and destructure**

Change:

```tsx
interface EventDialogProps {
  state: EventDialogState
  onOpenChange: (open: boolean) => void
  onSubmit: (event: CalendarEvent) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  organizationId?: string
}

export function EventDialog({
  state,
  onOpenChange,
  onSubmit,
  onDelete,
  organizationId,
}: EventDialogProps) {
```

to:

```tsx
interface EventDialogProps {
  state: EventDialogState
  onOpenChange: (open: boolean) => void
  onSubmit: (event: CalendarEvent) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
}

export function EventDialog({
  state,
  onOpenChange,
  onSubmit,
  onDelete,
}: EventDialogProps) {
```

- [ ] **Step 3: Remove the attachments block from the form**

Delete this block (currently between the `FieldGroup` closing tag and the `DialogFooter`):

```tsx
          {isEdit && (
            <div className="mt-4 border-t border-border pt-4">
              <EventFileAttachments eventId={content.event.id} organizationId={organizationId} />
            </div>
          )}

```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @echo/web typecheck`
Expected: FAILS at this point — `apps/web/src/routes/organizations/$organizationSlug/calendar/$eventId.tsx` still passes `organizationId` to `<EventDialog>`, which no longer accepts that prop. This is expected; Task 5 fixes the caller. Confirm the only error reported is that one (no other unrelated type errors introduced by this task's edit).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/event-calendar/event-dialog.tsx
git commit -m "refactor(web): remove attachment UI from EventDialog"
```

---

### Task 4: `EventDetail` forwards `organizationId` to `EventAttachments`

**Files:**
- Modify: `apps/web/src/components/ui/event-calendar/event-detail.tsx`
- Modify: `apps/web/src/components/ui/event-calendar/event-detail.test.tsx`

**Interfaces:**
- Consumes: `EventAttachmentsProps.organizationId?: string` (Task 2).
- Produces: `EventDetailProps.organizationId?: string`, forwarded to `<EventAttachments>`.

- [ ] **Step 1: Write the failing test**

Add to `apps/web/src/components/ui/event-calendar/event-detail.test.tsx`, inside the `describe("EventDetail", ...)` block, after the last `it`:

```tsx
  it("forwards organizationId to EventAttachments for file uploads", async () => {
    const uploadSpy = vi.fn()
    vi.spyOn(fileResource, "useUploadFileMutation").mockReturnValue({
      mutate: uploadSpy,
      isPending: false,
      isError: false,
    } as never)
    vi.spyOn(fileResource, "useDeleteFileMutation").mockReturnValue({
      mutate: vi.fn(),
    } as never)

    const user = userEvent.setup()
    renderWithClient(
      <EventDetail
        event={makeEvent()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
        organizationId="org-1"
      />
    )

    const input = await screen.findByLabelText("Add files", { selector: "input" })
    const file = new File(["x"], "demo.mp3", { type: "audio/mpeg" })
    await user.upload(input, file)

    expect(uploadSpy).toHaveBeenCalledWith({ eventId: "1", organizationId: "org-1", file })
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @echo/web test -- src/components/ui/event-calendar/event-detail.test.tsx`
Expected: FAIL — `EventDetail` doesn't accept/forward `organizationId` yet, so the mutation is called without it (or the test fails on the prop being silently dropped and the assertion not matching).

- [ ] **Step 3: Implement**

In `apps/web/src/components/ui/event-calendar/event-detail.tsx`, change:

```tsx
export interface EventDetailProps {
  event: CalendarEvent
  onEdit: () => void
  onDelete: () => void
  onBack: () => void
  className?: string
}

export function EventDetail({
  event,
  onEdit,
  onDelete,
  onBack,
  className,
}: EventDetailProps) {
```

to:

```tsx
export interface EventDetailProps {
  event: CalendarEvent
  onEdit: () => void
  onDelete: () => void
  onBack: () => void
  organizationId?: string
  className?: string
}

export function EventDetail({
  event,
  onEdit,
  onDelete,
  onBack,
  organizationId,
  className,
}: EventDetailProps) {
```

And change the `EventAttachments` usage:

```tsx
      <EventAttachments eventId={event.id} />
```

to:

```tsx
      <EventAttachments eventId={event.id} organizationId={organizationId} />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @echo/web test -- src/components/ui/event-calendar/event-detail.test.tsx`
Expected: PASS — all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/event-calendar/event-detail.tsx apps/web/src/components/ui/event-calendar/event-detail.test.tsx
git commit -m "feat(web): forward organizationId from EventDetail to EventAttachments"
```

---

### Task 5: Wire routes and final verification

**Files:**
- Modify: `apps/web/src/routes/organizations/$organizationSlug/calendar/$eventId.tsx`

**Interfaces:**
- Consumes: `EventDetailProps.organizationId?: string` (Task 4), `EventDialogProps` without `organizationId` (Task 3).

`apps/web/src/routes/calendar/$eventId.tsx` needs no change: it has no `organizationId` in scope and today doesn't pass it to `EventDialog` either — it stays exactly as-is, and `EventDetail` there simply receives no `organizationId` (matching its now-optional prop).

- [ ] **Step 1: Move `organizationId` from `EventDialog` to `EventDetail` in the org route**

In `apps/web/src/routes/organizations/$organizationSlug/calendar/$eventId.tsx`, change:

```tsx
      <EventDetail
        event={viewEvent}
        onEdit={() => setDialogState({ mode: 'edit', event: viewEvent })}
        onDelete={() => handleDelete(viewEvent.id)}
        onBack={goBack}
      />
      <EventDialog
        state={dialogState}
        onOpenChange={(open) => !open && setDialogState(null)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        organizationId={organizationId}
      />
```

to:

```tsx
      <EventDetail
        event={viewEvent}
        onEdit={() => setDialogState({ mode: 'edit', event: viewEvent })}
        onDelete={() => handleDelete(viewEvent.id)}
        onBack={goBack}
        organizationId={organizationId}
      />
      <EventDialog
        state={dialogState}
        onOpenChange={(open) => !open && setDialogState(null)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @echo/web typecheck`
Expected: PASS — no type errors (this resolves the expected failure from Task 3, Step 4).

- [ ] **Step 3: Run the full web test suite**

Run: `pnpm test:web`
Expected: PASS — every test in `apps/web` passes, including all tests touched in Tasks 1, 2, and 4.

- [ ] **Step 4: Lint**

Run: `pnpm --filter @echo/web lint`
Expected: PASS — no lint errors (in particular, no unused-import errors from the removed `EventFileAttachments` import or the removed `organizationId` prop).

- [ ] **Step 5: Manual smoke check**

Start the dev server (`pnpm dev:web`) and in a browser:
1. Open an existing event's details page (`/calendar/$eventId` or the org equivalent).
2. Confirm an upload dropzone appears on the page itself, upload an image and an audio file, confirm both show up (gallery thumbnail + audio player) without a page reload.
3. Hover a gallery thumbnail, click its delete (×) icon, confirm the dialog, confirm the thumbnail disappears.
4. Delete the audio file the same way.
5. Click "Edit" to open the modal — confirm the modal shows only the event fields (title, description, dates, color) and no attachments UI.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/routes/organizations/\$organizationSlug/calendar/\$eventId.tsx
git commit -m "refactor(web): move attachment management to the event details page"
```

---

## Self-Review Notes

- **Spec coverage:** All six spec changes are covered — `event-attachments.tsx` (Task 2), `event-gallery.tsx` (Task 1), `event-file-attachments.tsx` deletion (Task 2), `event-dialog.tsx` (Task 3), `event-detail.tsx` (Task 4), both routes (Task 5, with the personal-calendar route explicitly confirmed as needing no edit). Data flow, error handling, and testing sections of the spec map 1:1 onto the tasks above; no backend changes were introduced anywhere in this plan, matching the spec's "no backend/tRPC changes" note.
- **Placeholder scan:** No TBDs; every step has literal code or an exact command with expected output.
- **Type consistency:** `EventFile`, `EventAttachmentsProps`, `EventGalleryProps`, `EventDetailProps`, `EventDialogProps` are used with identical shapes across every task that touches them.
