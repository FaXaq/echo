# Research: folder/directory structure for Drive on top of S3

**Question:** What's the best way to implement an in-app "drive" directory/folder structure when S3 is the underlying object store?

**Scope of sources:** AWS official docs (S3 API reference, S3 User Guide), AWS's own Knowledge Center (repost.aws, written by AWS), and the actual source/schema of two production open-source systems that layer a folder hierarchy on top of S3-compatible storage (Nextcloud, Supabase Storage). No secondary blog/SEO content is cited as a source of fact — where a generic search result surfaced a claim, it was traced back to the primary doc before being included here.

---

## 1. S3's native prefix/delimiter mechanism

S3 buckets are a flat key-value namespace. There is no directory object type. AWS states this plainly:

> "You can think of prefixes as a way to organize your data in a similar way to directories. However, prefixes are not directories."
> — [Organizing objects using prefixes](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-prefixes.html), Amazon S3 User Guide

> "Amazon S3 general purpose buckets have a flat structure instead of a hierarchy like you would see in a file system. However, for the sake of organizational simplicity, the Amazon S3 console supports the *folder* concept as a means of grouping objects. The console does this by using a shared name *prefix* for the grouped objects."
> — [Organizing objects in the Amazon S3 console by using folders](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-folders.html)

### How `ListObjectsV2` simulates folder listing

Per the [ListObjectsV2 API reference](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectsV2.html):

- `Prefix` — "Limits the response to keys that begin with the specified prefix."
- `Delimiter` — "A delimiter is a character that you use to group keys." Causes keys sharing the same string between `Prefix` and the first occurrence of the delimiter to be rolled up into `CommonPrefixes` instead of listed individually.
- `CommonPrefixes` — "lists keys that act like subdirectories in the directory specified by `Prefix`." Each rolled-up group counts as a single item toward `MaxKeys` (default/max 1,000 per call), and pagination is done via `IsTruncated` / `NextContinuationToken`.

Example from the same doc: keys `photos/2006/January/sample.jpg` and `photos/2006/February/sample*.jpg`, listed with `Prefix=photos/2006/&Delimiter=/`, return two `CommonPrefixes` entries (`photos/2006/February/`, `photos/2006/January/`) — a one-level-at-a-time folder browse, entirely computed server-side from key strings at list time.

### Real limitations (all confirmed against AWS's own docs)

1. **No true empty folders.** A "folder" created in the S3 console is implemented as "a 0-byte object" whose key is the folder name plus a trailing `/` — a real object occupying a slot in the bucket, not a first-class directory entity ([using-folders.html](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-folders.html)). Folders that arise purely from key prefixes with no such marker object do not exist independently of their contents — delete every key under a prefix and the "folder" disappears, because it was never a resource.
2. **No atomic rename/move of a folder.** The console doc says outright: "Folders can be created, deleted, and made public, but **they can't be renamed**." ([using-folders.html](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-folders.html)). There is no bulk "move prefix" API; every object under the old prefix must be individually copied to a new key and the old one deleted (see §3).
3. **No folder-level metadata.** Because a "folder" is either a zero-byte marker object or purely inferred from key strings, there is nowhere to attach folder-level attributes (owner, permissions, sort order, icon, soft-delete state, custom name unrelated to path) without hijacking object metadata on that marker object — a fragile approach since the marker can be deleted or never created via non-console paths (CLI/SDK/API don't require it).
4. **Listing performance / request-rate characteristics.** S3 auto-scales but partitions by key prefix: "your application can achieve at least 3,500 PUT/COPY/POST/DELETE or 5,500 GET/HEAD requests per second per partitioned Amazon S3 prefix," and scaling to a new rate "happens gradually and is not instantaneous" — sustained bursts can see `503 Slow Down` while S3 partitions the new prefix ([Best practices design patterns: optimizing Amazon S3 performance](https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html)). A deep, wide user-generated folder tree modeled purely as key prefixes means listing/paginating "folder contents" always costs a live `ListObjectsV2` round trip to S3 (1,000 keys/CommonPrefixes per page, `IsTruncated` pagination) — there's no way to get folder metadata (item count, size) without walking objects, and no indexing, filtering, or sorting beyond lexicographic key order (S3 "returns objects in lexicographical order based on their key names" — [ListObjectsV2 reference](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectsV2.html)).

---

## 2. The "flat keys + prefix convention" pattern — production evidence

The pattern: S3 keys stay flat and are either a storage-layout convenience (org/entity-scoped) or fully content-/ID-addressed, while the real hierarchy — name, parent folder, ordering, rename, move — lives in your own database table, decoupled from the S3 key.

**Nextcloud** (self-hosted file sync/share platform, the closest OSS analogue to a "Drive") is the clearest primary-source example. Its S3 object-store backend generates the object key purely from the internal numeric file ID, never from the file's name or path:

```php
public function getURN(int $fileId): string {
    return $this->objectPrefix . $fileId;
}
```
— [`ObjectStoreStorage.php`](https://github.com/nextcloud/server/blob/master/lib/private/Files/ObjectStore/ObjectStoreStorage.php), `nextcloud/server`

The method's own doc comment states the design intent directly: override it "if you need a different unique resource identifier... Make sure the URN is unique over all users. You may need a mapping table to store your URN if it cannot be generated from the fileid." The default URN is `urn:oid:<fileid>` (prefix configurable via `OBJECTSTORE_S3_OBJECT_PREFIX`). The entire filesystem tree — file/folder name, parent, path — lives in Nextcloud's `oc_filecache` database table, completely independent of the S3 key. Renaming or moving a file in Nextcloud's UI is a metadata-only DB update; the S3 object and its key never change.

**Supabase Storage** (open-source, S3-compatible object storage service backed by Postgres) takes the complementary approach of encoding hierarchy in a DB table rather than in S3 keys directly: its `storage.objects` table stores `bucket_id`, `name` (the full logical path/filename) and `path_tokens`, "an array field... each 'folder' in the path appears in order, which allows for querying files based on their directory structure" ([The Storage Schema](https://supabase.com/docs/guides/storage/schema/design), Supabase Docs). Folder browsing is a Postgres query over `path_tokens`, not a live call to the underlying S3-compatible backend — and the docs are explicit that all mutating operations (upload/copy/move/delete) must go through Supabase's API, not raw SQL, so the DB and the object store stay consistent.

Both are first-party, production OSS systems and both land on the same core idea from opposite ends: **don't make S3 key structure carry your folder semantics.** Nextcloud decouples the key entirely (ID-addressed); Supabase keeps path-like keys but makes the database, not `ListObjectsV2`, the source of truth for hierarchy queries.

AWS's own docs corroborate the "prefix is a display convenience, not a data model" framing — the `using-prefixes.html` guide frames prefix/delimiter purely as a way to "organize and then browse your keys hierarchically" for **listing**, not as a place to encode a mutable folder tree with move/rename semantics.

---

## 3. Trade-offs: renaming/moving a "folder" in S3

S3 has no rename or move API for general-purpose buckets. Confirmed directly:

> "Folders can be created, deleted, and made public, but they can't be renamed."
> — [using-folders.html](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-folders.html)

The only way to change an object's key is [`CopyObject`](https://docs.aws.amazon.com/AmazonS3/latest/API/API_CopyObject.html) ("Creates a copy of an object that is already stored in Amazon S3") to the new key, followed by a `DeleteObject` on the old key. `CopyObject` docs note: "You can store individual objects of up to 50 TB in Amazon S3. You create a copy of your object up to 5 GB in size in a single atomic action using this API. However, to copy an object greater than 5 GB, you must use the multipart upload Upload Part - Copy (UploadPartCopy) API." So "renaming a folder" that contains N objects (some potentially >5 GB) means N individual `CopyObject`/`UploadPartCopy` calls plus N `DeleteObject` calls — non-atomic, billed for the data transfer/requests, and with no rollback if it fails partway.

Nuance worth noting: in 2025 AWS shipped a genuine [`RenameObject`](https://docs.aws.amazon.com/AmazonS3/latest/API/API_RenameObject.html) API that performs an atomic, no-data-movement rename — but it is scoped exclusively to **S3 Express One Zone directory buckets**, a distinct, single-AZ storage class/bucket type, not the general-purpose buckets almost all applications (including this one) use ([Amazon S3 Express One Zone now supports atomic renaming of objects](https://aws.amazon.com/about-aws/whats-new/2025/06/amazon-s3-express-one-zone-atomic-renaming-objects-api)). It does not change the calculus for general-purpose-bucket-backed apps: no rename operation exists there, and copy+delete remains the only mechanism.

**Conclusion of this trade-off:** if a folder's identity is expressed as a literal S3 key prefix, then every rename or move of that folder is an O(N) copy+delete storm across every object nested under it, non-atomic and expensive at scale. If the folder is a row in a database table and the S3 key is ID-based (decoupled from folder path), renaming/moving is a single `UPDATE` — zero S3 API calls.

---

## 4. Recommendation

**Use a database-backed folder hierarchy, and treat S3 purely as ID-addressed blob storage, decoupled from any folder path.**

Concretely:
- A `folder` table: `id`, `organization_id`, `parent_folder_id` (nullable, self-referencing), `name`, ordering/position, timestamps. This is where rename, move, nesting, and any folder-level metadata (icon, permissions, soft-delete) live — all pure DB writes, no S3 calls.
- Each file row gets a `folder_id` (nullable = root) alongside its existing organization/event scoping.
- The S3 key stays ID-based and never encodes the folder path — e.g. keep (or extend) the existing `org/{organizationId}/{fileId}/{filename}` scheme, which is already how this repo's `createUpload` builds `s3Key` (see "Current state" below). A rename or move of a folder or file never touches S3.
- Folder contents are served by querying the `file`/`folder` tables (`WHERE parent_folder_id = ?`), not `ListObjectsV2` — gets you real pagination, sorting, filtering, and folder-level aggregates (count, size) without walking S3.
- S3's prefix/delimiter mechanism (§1) is not used for the app-facing folder feature at all; it remains a fine tool for purely internal storage partitioning (e.g. spreading write-heavy prefixes for throughput, per the performance-guidelines doc) but is the wrong layer to express user-mutable hierarchy.

Why this beats encoding the full path in the S3 key:
- **Rename/move is O(1) instead of O(N).** A path-in-key scheme (`org/{id}/{path}/{filename}`) turns every folder rename into the copy+delete storm described in §3 — non-atomic, costly, and race-prone under concurrent uploads. A DB-backed folder makes rename/move a single-row update.
- **No fake "empty folder" hacks.** S3 folders only "exist" as long as they contain an object, or via a fragile 0-byte marker convention the console itself uses (§1). A DB row is a real, first-class folder regardless of contents.
- **Folder metadata has somewhere to live.** Permissions, ordering, display name independent of storage key, soft-delete — none of this fits cleanly on an S3 key or a marker object.
- **This is exactly the industry-proven pattern**, evidenced first-party by two different production OSS systems (§2) and implicit in how AWS itself frames prefixes as a listing/browsing convenience rather than a mutable data model.

---

## Current state in this repo — gap vs. recommendation

Investigated: `packages/modules/src/file/{domain,app,infrastructure}` and `packages/db/migrations/20260725175919_file.ts`.

**What's already right, and already matches the recommended pattern:**
- S3 keys are already ID-based and decoupled from the display filename/path: `createUpload` builds `s3Key = \`org/${scope.organizationId}/${id}/${input.filename}\`` (`packages/modules/src/file/app/create-upload.ts:68`), where `id` is a freshly generated `crypto.randomUUID()` — the filename segment is cosmetic, not the addressing key.
- Renaming a file today (`packages/modules/src/file/app/rename-file.ts`, backed by `RenameFileByIdCommandPort` / `rename-file-by-id.command.kysely.ts`) only updates the `file.filename` column in Postgres. It never touches S3 — no `CopyObject`, no key change. This is already living proof, inside this codebase, of the §4 recommendation: because the key is ID-based, a rename is a pure DB write.
- The `file` table (`packages/db/migrations/20260725175919_file.ts`) is a normal relational table (`organization_id`, `event_id`, `uploaded_by`, `kind`, `s3_key`, `status`, etc.) — the right kind of place to add folder structure.

**What's missing — there is currently no folder concept at all:**
- No `folder` table or anything equivalent in `packages/db/migrations/`.
- `FileRecord` (`packages/modules/src/file/domain/index.ts`) has no `parentFolderId`/`folderId` field — only `eventId` and `organizationId` for grouping.
- `list-organization-files` / `list-event-files` (`packages/modules/src/file/app/`) return a flat list scoped by organization or event; there is no "list children of folder X" query, and no `ListFoldersByParentQuery`-style port under `packages/modules/src/file/infrastructure/`.
- `S3StoragePort` (`packages/adapters/src/s3-storage/s3-storage.port.ts`) exposes only `createUploadUrl`, `createDownloadUrl`, `headObject`, `deleteObject` — no `listObjects`/prefix-based listing method exists (nor is one needed under the recommended design, since folder listing should be DB-driven, not `ListObjectsV2`-driven).

**Actionable takeaway:** the file module already does the hard part right (ID-based, path-decoupled S3 keys; DB-only renames). Adding folders is additive and low-risk: introduce a `folder` table (`id`, `organization_id`, `parent_folder_id`, `name`, timestamps) following the same port/factory DI pattern as the rest of `file/infrastructure` (see `.claude/skills/di-ports-and-factories/SKILL.md`, ADR-0004), add a nullable `folder_id` column to `file`, and extend the listing/app layer with folder-scoped queries — with zero changes needed to how S3 keys or uploads are structured.

---

## Sources

- [Organizing objects using prefixes](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-prefixes.html) — Amazon S3 User Guide
- [Organizing objects in the Amazon S3 console by using folders](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-folders.html) — Amazon S3 User Guide
- [ListObjectsV2 API Reference](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectsV2.html) — Amazon S3 API Reference
- [CopyObject API Reference](https://docs.aws.amazon.com/AmazonS3/latest/API/API_CopyObject.html) — Amazon S3 API Reference
- [RenameObject API Reference](https://docs.aws.amazon.com/AmazonS3/latest/API/API_RenameObject.html) — Amazon S3 API Reference (S3 Express One Zone / directory buckets only)
- [Amazon S3 Express One Zone now supports atomic renaming of objects with a single API call](https://aws.amazon.com/about-aws/whats-new/2025/06/amazon-s3-express-one-zone-atomic-renaming-objects-api) — AWS What's New
- [Best practices design patterns: optimizing Amazon S3 performance](https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html) — Amazon S3 User Guide
- [`ObjectStoreStorage.php`](https://github.com/nextcloud/server/blob/master/lib/private/Files/ObjectStore/ObjectStoreStorage.php) — `nextcloud/server` (OSS source code)
- [The Storage Schema](https://supabase.com/docs/guides/storage/schema/design) — Supabase Docs (Supabase Storage is OSS: [supabase/storage](https://github.com/supabase/storage))

Repo files consulted for "current state":
- `packages/modules/src/file/app/create-upload.ts`
- `packages/modules/src/file/app/rename-file.ts`
- `packages/modules/src/file/domain/index.ts`
- `packages/modules/src/file/infrastructure/insert-pending-file.command.kysely.ts`
- `packages/modules/src/file/infrastructure/rename-file-by-id.command.kysely.ts`
- `packages/adapters/src/s3-storage/s3-storage.port.ts`
- `packages/db/migrations/20260725175919_file.ts`
