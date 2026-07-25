# Event Attachment Audio Playback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users play back audio files attached to an event, with a real waveform visualization, from the read-only event details page (`EventDetail`).

**Architecture:** Backend adds a presigned S3 download URL to each file returned by `listEventFiles`. Frontend adds a new `AudioPlayer` component that fetches the audio once, decodes it client-side with the Web Audio API to draw a real waveform, and plays it back via a native `<audio>` element pointed at a blob URL from that same fetch. A new read-only `EventAttachments` list (separate from the existing upload/delete list used in the edit dialog) renders `AudioPlayer` for audio files and a plain filename row for everything else, and is wired into `EventDetail`.

**Tech Stack:** TypeScript, React 18, `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, Web Audio API (`AudioContext.decodeAudioData`), tRPC, Kysely, Vitest, Storybook, react-i18next.

## Global Constraints

- Playback only — no trimming, zoom, or export (spec: "Scope").
- Waveform bars come from real decoded audio data, not placeholders (spec: "Waveform data").
- `EventDetail` attachment list is read-only: audio gets `AudioPlayer`, video/image get a plain filename row, no upload/delete controls (spec: "Attachments UI").
- Presigned download URL expiry: 3600s (spec: "Backend changes").
- Every user-visible string must go through `t()` from `useTranslation("calendar")`, with an English entry in `packages/i18n/locales/en.json` and a French translation in `packages/i18n/locales/fr.json` (AGENTS.md translation rules).
- Repository port methods take `db: KyselyDB` as their first parameter; use cases receive ports via a `deps` object (AGENTS.md app-layer rules).

---

### Task 1: Add `createDownloadUrl` to the S3 storage port, adapter, and test fake

**Files:**
- Modify: `packages/modules/src/file/infrastructure/s3-storage.port.ts`
- Modify: `packages/modules/src/file/infrastructure/s3-storage.adapter.ts`
- Modify: `packages/modules/src/file/app/test-fixtures.ts`

**Interfaces:**
- Produces: `S3StoragePort.createDownloadUrl(key: string) => Promise<{ url: string }>`, and `makeFakeS3Storage()`'s fake implementation of it (`https://fake-s3.local/<key>?download`), consumed by Task 2.

There's no existing unit test for `s3-storage.adapter.ts` (it wraps the AWS SDK directly, same as the existing untested `createUploadUrl`), so this task is verified via typecheck rather than a red/green test cycle. Task 2 exercises the fake through `list-event-files.test.ts`.

- [ ] **Step 1: Add `createDownloadUrl` to the port**

In `packages/modules/src/file/infrastructure/s3-storage.port.ts`, add the new method to the interface:

```ts
export interface S3StoragePort {
  createUploadUrl: (input: {
    key: string;
    contentType: string;
    contentLength: number;
  }) => Promise<{ url: string }>;

  createDownloadUrl: (key: string) => Promise<{ url: string }>;

  headObject: (key: string) => Promise<{ exists: boolean; sizeBytes: number | null }>;

  deleteObject: (key: string) => Promise<void>;
}
```

- [ ] **Step 2: Implement it in the adapter**

In `packages/modules/src/file/infrastructure/s3-storage.adapter.ts`, add `GetObjectCommand` to the import from `@aws-sdk/client-s3`:

```ts
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
```

Add the method to the returned object, alongside `createUploadUrl`:

```ts
    createDownloadUrl: async (key: string) => {
      const command = new GetObjectCommand({ Bucket: config.bucket, Key: key });
      const url = await getSignedUrl(client, command, { expiresIn: 3600 });
      return { url };
    },
```

- [ ] **Step 3: Add it to the test fake**

In `packages/modules/src/file/app/test-fixtures.ts`, add to `makeFakeS3Storage`'s returned object (it doesn't need to track key existence — download is only ever requested for files already confirmed readable):

```ts
    createDownloadUrl: async (key) => ({ url: `https://fake-s3.local/${key}?download` }),
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @echo/modules typecheck`
Expected: no errors (the interface, adapter, and fake are all consistent).

- [ ] **Step 5: Commit**

```bash
git add packages/modules/src/file/infrastructure/s3-storage.port.ts packages/modules/src/file/infrastructure/s3-storage.adapter.ts packages/modules/src/file/app/test-fixtures.ts
git commit -m "feat(file): add presigned download URL to S3 storage port"
```

---

### Task 2: `listEventFiles` returns a `downloadUrl` per file

**Files:**
- Modify: `packages/modules/src/file/app/list-event-files.ts`
- Modify: `packages/modules/src/file/app/list-event-files.test.ts`

**Interfaces:**
- Consumes: `S3StoragePort.createDownloadUrl` from Task 1.
- Produces: `listEventFiles(deps: { db, fileRepo, userPermission, s3Storage }, input) => Promise<(FileRecord & { downloadUrl: string })[]>`, consumed by Task 3 (router wiring) and, transitively via `RouterOutputs`, by the frontend `EventFile` type in Task 6.

- [ ] **Step 1: Write the failing test**

In `packages/modules/src/file/app/list-event-files.test.ts`, replace the file with:

```ts
import { describe, expect, it } from "vitest";
import { listEventFiles } from "./list-event-files.js";
import { makeFakeFileRepo, makeFakeS3Storage, makeFakeUserPermission } from "./test-fixtures.js";

const personalFile = {
  id: "file-1",
  eventId: "event-1",
  organizationId: null,
  uploadedBy: "user-1",
  kind: "image" as const,
  mimeType: "image/png",
  sizeBytes: 100,
  originalFilename: "cover.png",
  s3Key: "personal/user-1/file-1/cover.png",
  status: "uploaded" as const,
};

const orgFile = {
  ...personalFile,
  id: "file-2",
  organizationId: "org-1",
  uploadedBy: "user-2",
  s3Key: "org/org-1/file-2/cover.png",
};

describe("listEventFiles", () => {
  it("returns the uploader's own personal file with a downloadUrl", async () => {
    const files = await listEventFiles(
      {
        db: {} as never,
        fileRepo: makeFakeFileRepo([personalFile]),
        userPermission: makeFakeUserPermission(),
        s3Storage: makeFakeS3Storage(),
      },
      { eventId: "event-1", userId: "user-1" },
    );

    expect(files.map((f) => f.id)).toEqual(["file-1"]);
    expect(files[0].downloadUrl).toBe(
      "https://fake-s3.local/personal/user-1/file-1/cover.png?download",
    );
  });

  it("excludes another user's personal file when selfRead/read are both denied", async () => {
    const files = await listEventFiles(
      {
        db: {} as never,
        fileRepo: makeFakeFileRepo([personalFile]),
        userPermission: makeFakeUserPermission({
          userHasPermission: async () => ({ success: false, error: null }),
        }),
        s3Storage: makeFakeS3Storage(),
      },
      { eventId: "event-1", userId: "someone-else" },
    );

    expect(files).toEqual([]);
  });

  it("returns an organization file when the caller has org file:read", async () => {
    const files = await listEventFiles(
      {
        db: {} as never,
        fileRepo: makeFakeFileRepo([orgFile]),
        userPermission: makeFakeUserPermission(),
        s3Storage: makeFakeS3Storage(),
      },
      { eventId: "event-1", userId: "user-3" },
    );

    expect(files.map((f) => f.id)).toEqual(["file-2"]);
  });

  it("excludes an organization file when the caller lacks org file:read", async () => {
    const files = await listEventFiles(
      {
        db: {} as never,
        fileRepo: makeFakeFileRepo([orgFile]),
        userPermission: makeFakeUserPermission({
          userHasPermissionInOrganization: async () => ({
            success: false,
            error: null,
            role: null,
          }),
        }),
        s3Storage: makeFakeS3Storage(),
      },
      { eventId: "event-1", userId: "user-3" },
    );

    expect(files).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @echo/modules test -- list-event-files.test.ts`
Expected: FAIL — `files[0].downloadUrl` is `undefined`, and TS complains `s3Storage` doesn't exist on the deps type yet (or is unused).

- [ ] **Step 3: Implement it**

Replace `packages/modules/src/file/app/list-event-files.ts` with:

```ts
import type { KyselyDB } from "@echo/db";
import type { UserPermissionRepoPort } from "@echo/modules/user/infrastructure";
import type { FileRecord } from "../domain/index.js";
import type { FileRepoPort } from "../infrastructure/file-repository.port.js";
import type { S3StoragePort } from "../infrastructure/s3-storage.port.js";

async function canRead(
  userPermission: UserPermissionRepoPort,
  file: FileRecord,
  userId: string,
): Promise<boolean> {
  if (file.organizationId) {
    const { success } = await userPermission.userHasPermissionInOrganization({
      organizationId: file.organizationId,
      permissions: { file: ["read"] },
    });
    return success;
  }

  if (file.uploadedBy === userId) {
    const { success } = await userPermission.userHasPermission({
      permissions: { file: ["selfRead"] },
    });
    return success;
  }

  const { success } = await userPermission.userHasPermission({
    permissions: { file: ["read"] },
  });
  return success;
}

export async function listEventFiles(
  deps: {
    db: KyselyDB;
    fileRepo: FileRepoPort;
    userPermission: UserPermissionRepoPort;
    s3Storage: S3StoragePort;
  },
  input: { eventId: string; userId: string },
): Promise<(FileRecord & { downloadUrl: string })[]> {
  const files = await deps.fileRepo.listByEvent(deps.db, input.eventId);

  const readable: (FileRecord & { downloadUrl: string })[] = [];
  for (const file of files) {
    if (await canRead(deps.userPermission, file, input.userId)) {
      const { url } = await deps.s3Storage.createDownloadUrl(file.s3Key);
      readable.push({ ...file, downloadUrl: url });
    }
  }
  return readable;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @echo/modules test -- list-event-files.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/modules/src/file/app/list-event-files.ts packages/modules/src/file/app/list-event-files.test.ts
git commit -m "feat(file): include downloadUrl in listEventFiles results"
```

---

### Task 3: Wire `ctx.s3Storage` into the `listEventFiles` tRPC procedure

**Files:**
- Modify: `apps/api/src/router/file.ts`

**Interfaces:**
- Consumes: `listEventFiles` from Task 2; `ctx.s3Storage: S3StoragePort` (already present on `Context`, `apps/api/src/trpc.ts:28`, and already wired in `apps/api/src/context.ts`).
- Produces: `file.listEventFiles` tRPC query now returns `downloadUrl` per file, consumed by the frontend `EventFile` type (`apps/web/src/services/resources/file.ts`) in Task 6.

There's no existing router-level test file for `file.ts` (no precedent in this codebase for tRPC router integration tests here), so this task is verified via typecheck.

- [ ] **Step 1: Update the procedure**

In `apps/api/src/router/file.ts`, change the `listEventFiles` procedure body to pass `s3Storage`:

```ts
    listEventFiles: authedProcedure
      .input(z.object({ eventId: z.string() }))
      .query(({ ctx, input }) =>
        listEventFiles(
          { db: ctx.db, fileRepo: ctx.fileRepo, userPermission: ctx.userPermission, s3Storage: ctx.s3Storage },
          { eventId: input.eventId, userId: ctx.session.user.id },
        ),
      ),
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @echo/api typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/router/file.ts
git commit -m "feat(api): pass s3Storage into listEventFiles procedure"
```

---

### Task 4: `computeWaveformPeaks` pure function

**Files:**
- Create: `apps/web/src/components/ui/audio-waveform.ts`
- Create: `apps/web/src/components/ui/audio-waveform.test.ts`

**Interfaces:**
- Produces: `computeWaveformPeaks(channelData: Float32Array, bucketCount: number): number[]` — an array of length `bucketCount`, each value the max absolute sample in that bucket (0–1 for normalized PCM). Consumed by `AudioPlayer` in Task 5.

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/ui/audio-waveform.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { computeWaveformPeaks } from "./audio-waveform"

describe("computeWaveformPeaks", () => {
  it("buckets samples into the requested number of peaks, taking max abs per bucket", () => {
    const data = new Float32Array([0, 0.2, -0.5, 0.1, 0.9, -0.9, 0.3, 0.1])
    const peaks = computeWaveformPeaks(data, 4)
    expect(peaks).toEqual([0.2, 0.5, 0.9, 0.3])
  })

  it("returns zeroed peaks for silence", () => {
    const data = new Float32Array(100)
    const peaks = computeWaveformPeaks(data, 10)
    expect(peaks).toEqual(new Array(10).fill(0))
  })

  it("does not crash on empty channel data", () => {
    const peaks = computeWaveformPeaks(new Float32Array(0), 8)
    expect(peaks).toEqual(new Array(8).fill(0))
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @echo/web test -- audio-waveform.test.ts`
Expected: FAIL — `Cannot find module './audio-waveform'`.

- [ ] **Step 3: Implement it**

Create `apps/web/src/components/ui/audio-waveform.ts`:

```ts
export function computeWaveformPeaks(channelData: Float32Array, bucketCount: number): number[] {
  const bucketSize = Math.floor(channelData.length / bucketCount) || 1
  const peaks: number[] = []

  for (let i = 0; i < bucketCount; i++) {
    const start = i * bucketSize
    const end = Math.min(start + bucketSize, channelData.length)
    let max = 0
    for (let j = start; j < end; j++) {
      const abs = Math.abs(channelData[j])
      if (abs > max) max = abs
    }
    peaks.push(max)
  }

  return peaks
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @echo/web test -- audio-waveform.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/audio-waveform.ts apps/web/src/components/ui/audio-waveform.test.ts
git commit -m "feat(web): add computeWaveformPeaks helper"
```

---

### Task 5: `AudioPlayer` component

**Files:**
- Create: `apps/web/src/components/ui/audio-player.tsx`
- Create: `apps/web/src/components/ui/audio-player.test.tsx`
- Create: `apps/web/src/components/ui/audio-player.stories.tsx`
- Modify: `packages/i18n/locales/en.json`
- Modify: `packages/i18n/locales/fr.json`

**Interfaces:**
- Consumes: `computeWaveformPeaks` from Task 4; `Button` (`@/components/ui/button`), `Skeleton` (`@/components/ui/skeleton`).
- Produces: `AudioPlayer({ src: string; filename: string })` — a self-contained playback widget, consumed by `EventAttachments` in Task 6.

- [ ] **Step 1: Add translation strings**

In `packages/i18n/locales/en.json`, inside the `"calendar"` namespace, add after `"No files attached": "No files attached",` (line 247):

```json
    "No files attached": "No files attached",
    "Play": "Play",
    "Pause": "Pause",
    "Unable to preview waveform": "Unable to preview waveform",
```

In `packages/i18n/locales/fr.json`, inside the `"calendar"` namespace, add after `"No files attached": "Aucun fichier joint",`:

```json
    "No files attached": "Aucun fichier joint",
    "Play": "Lire",
    "Pause": "Pause",
    "Unable to preview waveform": "Impossible d'afficher l'aperçu audio",
```

- [ ] **Step 2: Write the failing tests**

Create `apps/web/src/components/ui/audio-player.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AudioPlayer } from "./audio-player"

function makeFakeAudioBuffer(length = 640): AudioBuffer {
  const data = new Float32Array(length).fill(0.5)
  return {
    getChannelData: () => data,
    numberOfChannels: 1,
    length,
    duration: 10,
    sampleRate: 44100,
  } as unknown as AudioBuffer
}

class FakeAudioContext {
  decodeAudioData = vi.fn().mockResolvedValue(makeFakeAudioBuffer())
  close = vi.fn().mockResolvedValue(undefined)
}

describe("AudioPlayer", () => {
  beforeEach(() => {
    vi.stubGlobal("AudioContext", FakeAudioContext)
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      }),
    )
    URL.createObjectURL = vi.fn(() => "blob:mock-url")
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("renders waveform bars once decoding finishes", async () => {
    render(<AudioPlayer src="https://example.com/demo.mp3" filename="demo.mp3" />)
    await waitFor(() =>
      expect(screen.getByTestId("audio-player-waveform").children.length).toBeGreaterThan(0),
    )
  })

  it("toggles the play/pause button when playback starts and stops", async () => {
    const user = userEvent.setup()
    render(<AudioPlayer src="https://example.com/demo.mp3" filename="demo.mp3" />)
    await screen.findByRole("button", { name: "Play" })

    const audio = document.querySelector("audio") as HTMLAudioElement
    audio.play = vi.fn().mockImplementation(() => {
      fireEvent.play(audio)
      return Promise.resolve()
    })
    audio.pause = vi.fn().mockImplementation(() => {
      fireEvent.pause(audio)
    })

    await user.click(screen.getByRole("button", { name: "Play" }))
    expect(audio.play).toHaveBeenCalled()
    await screen.findByRole("button", { name: "Pause" })

    await user.click(screen.getByRole("button", { name: "Pause" }))
    expect(audio.pause).toHaveBeenCalled()
    await screen.findByRole("button", { name: "Play" })
  })

  it("falls back to a native audio element when the fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))
    render(<AudioPlayer src="https://example.com/demo.mp3" filename="demo.mp3" />)

    expect(await screen.findByText("Unable to preview waveform")).toBeInTheDocument()
    expect(document.querySelector("audio[controls]")).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm --filter @echo/web test -- audio-player.test.tsx`
Expected: FAIL — `Cannot find module './audio-player'`.

- [ ] **Step 4: Implement the component**

Create `apps/web/src/components/ui/audio-player.tsx`:

```tsx
import { useEffect, useRef, useState } from "react"
import { Pause, Play } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { computeWaveformPeaks } from "./audio-waveform"

const BUCKET_COUNT = 64

export interface AudioPlayerProps {
  src: string
  filename: string
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function AudioPlayer({ src, filename }: AudioPlayerProps) {
  const { t } = useTranslation("calendar")
  const audioRef = useRef<HTMLAudioElement>(null)
  const waveformRef = useRef<HTMLDivElement>(null)

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [peaks, setPeaks] = useState<number[]>([])
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    let cancelled = false
    let createdObjectUrl: string | null = null
    setStatus("loading")
    setPeaks([])

    async function load() {
      try {
        const response = await fetch(src)
        if (!response.ok) throw new Error("Failed to fetch audio")
        const arrayBuffer = await response.arrayBuffer()
        if (cancelled) return

        createdObjectUrl = URL.createObjectURL(new Blob([arrayBuffer]))
        setObjectUrl(createdObjectUrl)

        const AudioContextCtor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const audioContext = new AudioContextCtor()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        await audioContext.close()
        if (cancelled) return

        setPeaks(computeWaveformPeaks(audioBuffer.getChannelData(0), BUCKET_COUNT))
        setStatus("ready")
      } catch {
        if (!cancelled) setStatus("error")
      }
    }

    load()

    return () => {
      cancelled = true
      if (createdObjectUrl) URL.revokeObjectURL(createdObjectUrl)
    }
  }, [src])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play()
    else audio.pause()
  }

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    const el = waveformRef.current
    if (!audio || !el || duration === 0) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * duration
  }

  if (status === "error") {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">{t("Unable to preview waveform")}</p>
        <audio controls src={src} className="h-8 w-full" aria-label={filename} />
      </div>
    )
  }

  const progress = duration > 0 ? currentTime / duration : 0

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={status === "loading"}
        aria-label={isPlaying ? t("Pause") : t("Play")}
        onClick={togglePlay}
      >
        {isPlaying ? <Pause /> : <Play />}
      </Button>

      <div
        ref={waveformRef}
        data-testid="audio-player-waveform"
        aria-label={filename}
        onClick={handleSeek}
        className="relative h-8 flex-1 cursor-pointer"
      >
        {status === "loading" ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <>
            <div className="flex h-full items-end gap-px">
              {peaks.map((peak, i) => (
                <span
                  key={i}
                  className="min-w-px flex-1 rounded-full bg-muted-foreground/30"
                  style={{ height: `${Math.max(peak * 100, 8)}%` }}
                />
              ))}
            </div>
            <div
              className="absolute inset-0 flex h-full items-end gap-px"
              style={{ clipPath: `inset(0 ${100 - progress * 100}% 0 0)` }}
            >
              {peaks.map((peak, i) => (
                <span
                  key={i}
                  className="min-w-px flex-1 rounded-full bg-primary"
                  style={{ height: `${Math.max(peak * 100, 8)}%` }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <span className="text-xs tabular-nums text-muted-foreground">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      <audio
        ref={audioRef}
        src={objectUrl ?? undefined}
        className="hidden"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  )
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @echo/web test -- audio-player.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Add the Storybook story**

Create `apps/web/src/components/ui/audio-player.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react"
import { AudioPlayer } from "./audio-player"

function fakePeakData(length = 4410): Float32Array {
  const data = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    data[i] = Math.sin(i / 40) * (0.3 + 0.7 * Math.abs(Math.sin(i / 4000)))
  }
  return data
}

if (typeof window !== "undefined") {
  window.fetch = (async () => ({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(8),
  })) as typeof fetch

  class MockAudioContext {
    decodeAudioData() {
      return Promise.resolve({
        getChannelData: () => fakePeakData(),
        numberOfChannels: 1,
      } as unknown as AudioBuffer)
    }
    close() {
      return Promise.resolve()
    }
  }
  window.AudioContext = MockAudioContext as unknown as typeof AudioContext
  URL.createObjectURL = () => "blob:mock"
  URL.revokeObjectURL = () => {}
}

const meta = {
  title: "UI/AudioPlayer",
  component: AudioPlayer,
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
} satisfies Meta<typeof AudioPlayer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { src: "https://example.com/demo.mp3", filename: "demo.mp3" },
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/ui/audio-player.tsx apps/web/src/components/ui/audio-player.test.tsx apps/web/src/components/ui/audio-player.stories.tsx packages/i18n/locales/en.json packages/i18n/locales/fr.json
git commit -m "feat(web): add AudioPlayer component with real waveform playback"
```

---

### Task 6: `EventAttachments` read-only list

**Files:**
- Create: `apps/web/src/components/ui/event-calendar/event-attachments.tsx`
- Create: `apps/web/src/components/ui/event-calendar/event-attachments.test.tsx`
- Create: `apps/web/src/components/ui/event-calendar/event-attachments.stories.tsx`

**Interfaces:**
- Consumes: `AudioPlayer` from Task 5; `getEventFilesQueryOptions`, `EventFile` from `@/services/resources/file` (already produces `downloadUrl` and `kind` per Task 2/3).
- Produces: `EventAttachments({ eventId: string })`, consumed by `EventDetail` in Task 7. Renders nothing (`null`) when there are no files.

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/components/ui/event-calendar/event-attachments.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { EventAttachments } from "./event-attachments"
import * as fileResource from "@/services/resources/file"

vi.mock("@/components/ui/audio-player", () => ({
  AudioPlayer: ({ filename }: { filename: string }) => <div>Player: {filename}</div>,
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

  it("renders a plain filename row for non-audio files", async () => {
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

    renderWithClient(<EventAttachments eventId="event-1" />)
    expect(await screen.findByText("cover.png")).toBeInTheDocument()
    expect(screen.queryByText(/^Player:/)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @echo/web test -- event-attachments.test.tsx`
Expected: FAIL — `Cannot find module './event-attachments'`.

- [ ] **Step 3: Implement it**

Create `apps/web/src/components/ui/event-calendar/event-attachments.tsx`:

```tsx
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { AudioPlayer } from "@/components/ui/audio-player"
import { getEventFilesQueryOptions } from "@/services/resources/file"

export interface EventAttachmentsProps {
  eventId: string
}

export function EventAttachments({ eventId }: EventAttachmentsProps) {
  const { t } = useTranslation("calendar")
  const { data: files = [] } = useQuery(getEventFilesQueryOptions({ eventId }))

  if (files.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-medium text-muted-foreground">{t("Attachments")}</h3>
      <ul className="flex flex-col gap-2">
        {files.map((file) => (
          <li key={file.id} className="text-xs">
            {file.kind === "audio" ? (
              <AudioPlayer src={file.downloadUrl} filename={file.originalFilename} />
            ) : (
              <span className="truncate">{file.originalFilename}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @echo/web test -- event-attachments.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Add the Storybook story**

Create `apps/web/src/components/ui/event-calendar/event-attachments.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { EventAttachments } from "./event-attachments"
import { getEventFilesQueryOptions, type EventFile } from "@/services/resources/file"

function withSeededFiles(files: EventFile[]) {
  const queryClient = new QueryClient()
  queryClient.setQueryData(getEventFilesQueryOptions({ eventId: "event-1" }).queryKey, files)
  return queryClient
}

const meta = {
  title: "UI/EventCalendar/EventAttachments",
  component: EventAttachments,
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
} satisfies Meta<typeof EventAttachments>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: { eventId: "event-1" },
  decorators: [
    (Story) => (
      <QueryClientProvider client={withSeededFiles([])}>
        <Story />
      </QueryClientProvider>
    ),
  ],
}

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
        ])}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/ui/event-calendar/event-attachments.tsx apps/web/src/components/ui/event-calendar/event-attachments.test.tsx apps/web/src/components/ui/event-calendar/event-attachments.stories.tsx
git commit -m "feat(web): add read-only EventAttachments list"
```

---

### Task 7: Wire `EventAttachments` into `EventDetail`

**Files:**
- Modify: `apps/web/src/components/ui/event-calendar/event-detail.tsx`
- Modify: `apps/web/src/components/ui/event-calendar/event-detail.test.tsx`
- Modify: `apps/web/src/components/ui/event-calendar/event-detail.stories.tsx`

**Interfaces:**
- Consumes: `EventAttachments` from Task 6.

`EventDetail`'s existing tests render the component without a `QueryClientProvider`. Since `EventAttachments` now calls `useQuery` internally, those tests need a provider — this task updates them alongside the integration (production already has a root-level `QueryClientProvider` in `apps/web/src/routes/__root.tsx`, so no app-level wiring changes are needed).

- [ ] **Step 1: Write the failing test**

Replace `apps/web/src/components/ui/event-calendar/event-detail.test.tsx` with:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import dayjs from "dayjs"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EventDetail } from "./event-detail"
import type { CalendarEvent } from "./types"
import * as fileResource from "@/services/resources/file"

vi.mock("@/components/ui/audio-player", () => ({
  AudioPlayer: ({ filename }: { filename: string }) => <div>Player: {filename}</div>,
}))

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "1",
    title: "Standup",
    startDate: dayjs().hour(9).minute(0).second(0).millisecond(0).toDate(),
    endDate: dayjs().hour(9).minute(30).second(0).millisecond(0).toDate(),
    color: "blue",
    ...overrides,
  }
}

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe("EventDetail", () => {
  beforeEach(() => {
    vi.spyOn(fileResource, "getEventFilesQueryOptions").mockReturnValue({
      queryKey: ["file", "listEventFiles"],
      queryFn: async () => [],
    } as never)
  })

  it("renders the event title and description", () => {
    const event = makeEvent({ description: "Daily sync" })
    renderWithClient(
      <EventDetail event={event} onEdit={vi.fn()} onDelete={vi.fn()} onBack={vi.fn()} />
    )

    expect(
      screen.getByRole("heading", { name: "Standup" })
    ).toBeInTheDocument()
    expect(screen.getByText("Daily sync")).toBeInTheDocument()
  })

  it("calls onBack when the back button is clicked", async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    renderWithClient(
      <EventDetail event={makeEvent()} onEdit={vi.fn()} onDelete={vi.fn()} onBack={onBack} />
    )

    await user.click(screen.getByRole("button", { name: "Back to calendar" }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it("calls onEdit when the edit button is clicked", async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    renderWithClient(
      <EventDetail event={makeEvent()} onEdit={onEdit} onDelete={vi.fn()} onBack={vi.fn()} />
    )

    await user.click(screen.getByRole("button", { name: "Edit" }))
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it("calls onDelete after confirming in the alert dialog", async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    renderWithClient(
      <EventDetail event={makeEvent()} onEdit={vi.fn()} onDelete={onDelete} onBack={vi.fn()} />
    )

    await user.click(screen.getByRole("button", { name: "Delete" }))
    const confirmDialog = await screen.findByRole("alertdialog")
    await user.click(
      within(confirmDialog).getByRole("button", { name: "Delete" })
    )

    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it("renders an AudioPlayer for an attached audio file", async () => {
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

    renderWithClient(
      <EventDetail event={makeEvent()} onEdit={vi.fn()} onDelete={vi.fn()} onBack={vi.fn()} />
    )

    expect(await screen.findByText("Player: demo.mp3")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify the new test fails**

Run: `pnpm --filter @echo/web test -- event-detail.test.tsx`
Expected: the first four tests still pass; "renders an AudioPlayer for an attached audio file" FAILS since `EventDetail` doesn't render attachments yet.

- [ ] **Step 3: Wire `EventAttachments` into `EventDetail`**

In `apps/web/src/components/ui/event-calendar/event-detail.tsx`, add the import:

```ts
import { EventAttachments } from "./event-attachments"
```

Insert the component between the description block and the edit/delete button row:

```tsx
        {event.description && (
          <p className="whitespace-pre-wrap">{event.description}</p>
        )}
      </div>

      <EventAttachments eventId={event.id} />

      <div className="flex gap-2">
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @echo/web test -- event-detail.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Update the Storybook story**

Replace `apps/web/src/components/ui/event-calendar/event-detail.stories.tsx` with:

```tsx
import type { Meta, StoryObj } from "@storybook/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { EventDetail } from "./event-detail"
import { getEventFilesQueryOptions } from "@/services/resources/file"

function withEmptyFiles() {
  const queryClient = new QueryClient()
  queryClient.setQueryData(getEventFilesQueryOptions({ eventId: "1" }).queryKey, [])
  return queryClient
}

const meta = {
  title: "UI/EventDetail",
  component: EventDetail,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <QueryClientProvider client={withEmptyFiles()}>
        <div className="w-96">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof EventDetail>

export default meta
type Story = StoryObj<typeof meta>

const baseEvent = {
  id: "1",
  title: "Team standup",
  description: "Daily sync on current work and blockers.",
  startDate: new Date("2026-08-03T09:00:00"),
  endDate: new Date("2026-08-03T09:30:00"),
  color: "blue",
} as const

export const Default: Story = {
  args: {
    event: baseEvent,
    onEdit: () => {},
    onDelete: () => {},
    onBack: () => {},
  },
}

export const AllDay: Story = {
  args: {
    event: {
      ...baseEvent,
      title: "Company offsite",
      description: "Full-day offsite, no meetings.",
      allDay: true,
      color: "purple",
    },
    onEdit: () => {},
    onDelete: () => {},
    onBack: () => {},
  },
}

export const NoDescription: Story = {
  args: {
    event: { ...baseEvent, description: undefined, color: "green" },
    onEdit: () => {},
    onDelete: () => {},
    onBack: () => {},
  },
}
```

- [ ] **Step 6: Run the full web test suite**

Run: `pnpm --filter @echo/web test`
Expected: PASS, no regressions in other suites (`event-file-attachments.test.tsx`, `event-dialog` tests, etc. are unaffected — they don't touch `EventDetail`).

- [ ] **Step 7: Typecheck the frontend**

Run: `pnpm --filter @echo/web typecheck`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/ui/event-calendar/event-detail.tsx apps/web/src/components/ui/event-calendar/event-detail.test.tsx apps/web/src/components/ui/event-calendar/event-detail.stories.tsx
git commit -m "feat(web): show attachment audio players on the event details page"
```

---

## Manual verification (after all tasks)

- [ ] Run `pnpm dev`, open an event with an attached audio file (upload one via the edit dialog first, since `EventDetail` itself is read-only), navigate to its details page, and confirm: waveform renders, play/pause works, clicking the waveform seeks, and the time readout updates.
- [ ] Attach a non-audio file (e.g. an image) to the same event and confirm it shows as a plain filename row on the details page, no player.
- [ ] Open `pnpm --filter @echo/web storybook` and check `UI/AudioPlayer`, `UI/EventCalendar/EventAttachments`, and `UI/EventDetail` stories render without console errors.
