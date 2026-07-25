# File upload & persistence

## Problem

There is currently no way to attach files (audio, video, image) to a
calendar event, or to persist files at all. `appConfig.s3`, the S3 env vars,
the `@aws-sdk/client-s3` / `@aws-sdk/s3-request-presigner` dependencies, and
a `docker-compose` localstack service (with S3 bucket + CORS init script)
are already scaffolded but unused.

## Goals

- A user can upload a file (audio, video, or image) and attach it to a
  calendar event.
- Files can belong to a user personally, or to an organization — chosen
  independently of the event's own personal/organization ownership.
- Uploads go directly from the browser to S3 (localstack in dev) via a
  presigned URL; file bytes never pass through the Fastify API process.
- File type and size are enforced server-side.
- Access control mirrors the existing calendar-event permission pattern,
  using new `file` resource permissions (system-level for personal files,
  organization-level for org files) rather than ad-hoc ownership checks.

## Non-goals

- Standalone files not attached to any event. `event_id` is nullable in the
  schema for future flexibility, but the only supported flow today always
  sets it.
- Multi-part / chunked / resumable uploads. The 100 MB cap makes a single
  presigned `PUT` sufficient.
- Editing/replacing an already-uploaded file in place. Replacing means
  delete + re-upload.
- Virus/malware scanning of uploaded content.
- A generic "my files" browsing UI outside the event dialog.

## Design

### 1. Database: `file` table

New migration `packages/db/migrations/<timestamp>_file.ts`, mirroring the
style of `20260719143454_calendar-event.ts` (`text` ids, `timestamptz`,
`sql\`now()\`` defaults):

```ts
await db.schema
  .createTable("file")
  .addColumn("id", "text", (col) => col.primaryKey().notNull())
  .addColumn("event_id", "text", (col) => col.references("calendar_event.id").onDelete("cascade"))
  .addColumn("organization_id", "text", (col) => col.references("organization.id").onDelete("cascade"))
  .addColumn("uploaded_by", "text", (col) => col.notNull().references("user.id").onDelete("cascade"))
  .addColumn("kind", "text", (col) => col.notNull())
  .addColumn("mime_type", "text", (col) => col.notNull())
  .addColumn("size_bytes", "bigint", (col) => col.notNull())
  .addColumn("original_filename", "text", (col) => col.notNull())
  .addColumn("s3_key", "text", (col) => col.notNull().unique())
  .addColumn("status", "text", (col) => col.notNull().defaultTo("pending"))
  .addColumn("created_at", "timestamptz", (col) => col.defaultTo(sql`now()`))
  .addColumn("updated_at", "timestamptz", (col) => col.defaultTo(sql`now()`))
  .execute();
```

- `event_id` nullable: every file created today has one, but the column
  doesn't force it, leaving room for standalone files later.
- `organization_id` nullable: `null` = personal file. This is **independent**
  of the linked event's own `organization_id` — a personal file can be
  attached to an org event and vice versa.
- `kind`: `"audio" | "video" | "image"`, derived server-side from
  `mime_type` (see §3) — never trusted as raw client input.
- `status`: `"pending" | "uploaded"`. Rows start `pending` when the
  presigned URL is issued and flip to `uploaded` only once the API confirms
  the object exists in S3. Listing queries only ever return `uploaded` rows.

### 2. New module: `packages/modules/src/file/`

Same three-layer shape as `calendar`:

- **`domain/index.ts`** — pure, no framework imports:
  - `FileKind = "audio" | "video" | "image"`
  - `MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024`
  - `MIME_TYPES_BY_KIND: Record<FileKind, readonly string[]>`, initial
    allowlist:
    - `audio`: `audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/flac`, `audio/mp4`
    - `video`: `video/mp4`, `video/webm`, `video/quicktime`
    - `image`: `image/png`, `image/jpeg`, `image/webp`, `image/gif`
  - `kindForMimeType(mimeType): FileKind | null` — looks up which kind (if
    any) a mime type belongs to.
  - `isValidFileSize(sizeBytes): boolean`
  - `type FileRecord` — the domain shape returned to callers.

- **`infrastructure/`**:
  - `file-repository.port.ts` — `FileRepoPort`: `insertPending`, `markUploaded`,
    `findById`, `listByEvent` (uploaded only), `deleteById`. Every method
    takes `db: KyselyDB` first, per convention.
  - `file-repository.adapter.ts` — Kysely implementation, maps
    `snake_case` rows to camelCase `FileRecord`.
  - `s3-storage.port.ts` — `S3StoragePort`: `createUploadUrl(input: { key, contentType, contentLength }): Promise<{ url: string }>`,
    `headObject(key): Promise<{ exists: boolean; sizeBytes?: number }>`,
    `deleteObject(key): Promise<void>`.
  - `s3-storage.adapter.ts` — `makeS3Storage(config: { bucket, region, endpoint?, accessKeyId, secretAccessKey })`
    wraps `S3Client` + `PutObjectCommand`/`getSignedUrl`,
    `HeadObjectCommand`, `DeleteObjectCommand`. Sets `forcePathStyle: true`
    whenever `endpoint` is set (required for localstack).

- **`app/`** — one file per use case, barrel in `app/index.ts`:
  - `create-upload.ts` — validates mime type/size, checks permission
    (§4), builds the S3 key (§3), inserts a `pending` row, returns
    `{ fileId, uploadUrl }`.
  - `confirm-upload.ts` — loads the row, `HeadObject`s the key; if present,
    marks `uploaded`; if missing, throws `conflict(...)` and leaves the row
    `pending`.
  - `list-event-files.ts` — lists `uploaded` files for an event; checks
    read permission per file's own `organization_id`/`uploaded_by`.
  - `delete-file.ts` — checks delete permission (§4), deletes the S3
    object, then the row.

### 3. Upload flow & S3 key strategy

1. Client calls `file.createUpload` with
   `{ eventId?, organizationId?, mimeType, sizeBytes, filename }`.
2. Use case derives `kind` from `mimeType` via `kindForMimeType` (rejects
   with `conflict("Unsupported file type")` if unmapped), checks
   `sizeBytes <= MAX_FILE_SIZE_BYTES`, checks create permission (§4),
   generates `id = crypto.randomUUID()`, and builds:
   - personal: `s3_key = personal/<uploadedBy>/<id>/<filename>`
   - org: `s3_key = org/<organizationId>/<id>/<filename>`
3. Inserts the `pending` row, asks `S3StoragePort.createUploadUrl` for a
   presigned `PUT` scoped to that key/content-type/content-length, returns
   `{ fileId: id, uploadUrl }`.
4. Client `PUT`s the raw file bytes directly to `uploadUrl`.
5. Client calls `file.confirmUpload({ id })`; the use case `HeadObject`s the
   key and flips the row to `uploaded` (or throws, per above).

### 4. Permissions

**System-level** (`packages/auth/src/plugins/admin/permissions.ts`) — new
`file` statement, checked via
`userPermission.userHasPermission({ permissions: { file: [...] } })`:

```ts
const fileActions = ["selfCreate", "selfRead", "selfDelete", "create", "read", "delete"] as const;
// statement.file = [...fileActions]

client role: file: ["selfCreate", "selfRead", "selfDelete"]
admin role:  file: [...fileActions] // full override, no ownership check
```

**Organization-level** (`packages/auth/src/plugins/organization/permissions.ts`)
— new `file` statement, checked via
`userPermission.userHasPermissionInOrganization({ organizationId, permissions: { file: [...] } })`:

```ts
const fileActions = ["create", "read", "delete"] as const;
// statement.file = [...fileActions]

member role: file: ["create", "read", "delete"]
owner/admin role: file: ["create", "read", "delete"]
```

**Use-case enforcement** (`create-upload`, `list-event-files`,
`delete-file`):

- Personal (`organizationId` omitted): create requires system `file:selfCreate`.
  Read/delete require ownership (`uploaded_by === session.user.id`) **and**
  `file:selfRead`/`file:selfDelete`, **or** system `file:read`/`file:delete`
  (admin override — no ownership check).
- Organization: create/read require
  `userHasPermissionInOrganization({ organizationId, permissions: { file: ["create"|"read"] } })`.
  Delete requires ownership **or**
  `userHasPermissionInOrganization({ organizationId, permissions: { file: ["delete"] } })`.
- Failing every applicable check throws `forbidden({ entity: "File", action })`.

### 5. tRPC router: `apps/api/src/router/file.ts`

```ts
export const makeFileRouter = () =>
  router({
    createUpload: authedProcedure
      .input(z.object({
        eventId: z.string().optional(),
        organizationId: z.string().optional(),
        mimeType: z.string(),
        sizeBytes: z.number().int().positive(),
        filename: z.string().min(1),
      }))
      .mutation(({ ctx, input }) => ...), // -> { fileId, uploadUrl }

    confirmUpload: authedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ ctx, input }) => ...),

    listEventFiles: authedProcedure
      .input(z.object({ eventId: z.string() }))
      .query(({ ctx, input }) => ...),

    deleteFile: authedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ ctx, input }) => ...),
  });
```

Composed into `makeAppRouter` as `file: makeFileRouter()`. Every handler
wraps its use-case call in try/catch → `appErrorToTRPC`, per convention.

**Wiring** (`apps/api/src/context.ts`): a `fileRepo` and an `s3Storage`
singleton are created alongside `db`/`mailer`, `s3Storage` built from
`appConfig.s3` (already defined), and both added to `Context`.

### 6. Frontend

**`apps/web/src/services/resources/file.ts`** (new resource module,
following `calendar.ts`/`invitation.ts`) — the only place that calls
`apiClient.file.*` or raw `fetch` for uploads:

```ts
const { key, getResourceKey } = initResourceKey("file");

export function getEventFilesQueryOptions(opts: { eventId: string }) { ... }

export function useUploadFileMutation({ onSuccess }: { onSuccess?: (file: EventFile) => void } = {}) {
  // mutationFn composes: apiClient.file.createUpload.mutate
  //   -> fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
  //   -> apiClient.file.confirmUpload.mutate
  // invalidates the `file` query key on success
}

export function useDeleteFileMutation({ onSuccess }: { onSuccess?: () => void } = {}) { ... }
```

Components never call `apiClient` or `fetch` directly — everything for
files routes through this module.

**UI:** install a shadcn file-upload block through the already-configured
`@ss-blocks` registry in `apps/web/components.json` (e.g.
`npx shadcn add @ss-blocks/file-upload-03` — exact variant picked at
implementation time for drag-and-drop + multi-file + progress + preview
support), landing at `apps/web/src/components/ui/file-upload.tsx` with a
co-located `file-upload.stories.tsx`, matching the flat-file convention
already used for `dialog.tsx`, `combobox.tsx`, etc.

**`event-dialog.tsx` integration:** new co-located
`apps/web/src/components/ui/event-calendar/-event-file-attachments.tsx`
(non-route, `-`-prefixed per TanStack Router convention), rendering the
installed `file-upload` component for picking/dropping files and the
existing attached-files list, wired to `getEventFilesQueryOptions`,
`useUploadFileMutation`, `useDeleteFileMutation`. `event-dialog.tsx`
renders it in a new section rather than growing further itself.

All new user-visible strings (upload errors, size/type validation
messages, delete confirmation) go through `t()`/`<Trans>` in the existing
`calendar` i18n namespace, added to `packages/i18n/locales/en.json` (and
`fr.json`).

### 7. Testing

- `packages/modules/src/file/domain`: Vitest unit tests for
  `kindForMimeType` and `isValidFileSize` — pure, no mocks.
- `packages/modules/src/file/app`: use-case tests against in-memory fakes
  for `FileRepoPort` and `S3StoragePort` (per AGENTS.md — mock ports, not
  DB/S3), covering both permission branches (personal self-only vs.
  admin/org-permission override) and the pending→uploaded confirm flow
  (including the "object never landed" failure path).
- `apps/api`: integration test hitting the tRPC `file` router against a
  real Postgres (Testcontainers, matching the existing pattern), with
  `S3StoragePort` faked (no real S3 needed for router-level tests).
- `apps/web`: component test for `-event-file-attachments.tsx` (upload
  progress/error states, delete) with the `file` resource module's hooks
  mocked.

## Open questions

None outstanding — all resolved during design discussion.
