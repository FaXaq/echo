# Drive: file handling

Files live in S3 under `org/<organizationId>/<fileId>/<filename>` (`s3Key`). The database row holds the metadata, and the bytes never pass through the API: the browser uploads to and downloads from S3 with signed URLs.

Image formats fall into three groups:

| Group | Formats | How it's previewed |
|---|---|---|
| Web | PNG, JPEG, WebP, GIF, AVIF, BMP, SVG | The browser renders the original |
| HEIC | HEIC, HEIF | Safari renders the original; other browsers convert it to JPEG with `heic-to` when viewed |
| Camera RAW | DNG, CR2, CR3, NEF, ARW, RAF, ORF, RW2 | The camera's embedded JPEG is extracted at upload and stored at `<s3Key>.preview.jpg` |

Accepted mime types and the RAW helpers (`isRawImage`, `previewKeyFor`, `fileObjectKeys`, `mimeTypeForFile`) live in [`domain/index.ts`](./domain/index.ts).

## Upload

```mermaid
flowchart TD
    A[User picks a file] --> B["mimeTypeForFile(file)<br/>browser type, or extension lookup for RAW"]
    B --> C{"isRawImage(mime)?"}
    C -- "no: web format or HEIC" --> E
    C -- yes --> D["extractRawPreview(file)<br/>findEmbeddedJpegs → pickRawPreview<br/>(largest ≤ 3 MB, else smallest)"]
    D --> E["tRPC drive.createUpload<br/>mimeType, sizeBytes, previewSizeBytes?"]

    subgraph API ["API: createUpload"]
        E --> F{"kindForMimeType(mime)"}
        F -- null --> X[ConflictError: Unsupported file type]
        F -- image --> G["Permission + file size + storage quota<br/>(size + preview size)"]
        G --> H["Insert pending file row<br/>s3Key = org/&lt;org&gt;/&lt;id&gt;/&lt;filename&gt;"]
        H --> I["Signed upload URL for s3Key"]
        I --> J{"RAW and previewSizeBytes?"}
        J -- yes --> K["Signed upload URL for<br/>s3Key.preview.jpg (image/jpeg)"]
        J -- no --> L
        K --> L["Return fileId, uploadUrl, previewUploadUrl"]
    end

    L --> M["Browser uploads original to S3"]
    M --> N{"previewUploadUrl?"}
    N -- yes --> O["Browser uploads preview JPEG to S3<br/>(failure ignored)"]
    N -- no --> P
    O --> P["tRPC drive.confirmUpload<br/>check original exists → status = uploaded"]
```

- Browsers often report an empty or vendor-specific type for RAW files, so `mimeTypeForFile` falls back to the file extension.
- RAW extraction runs in the browser (`apps/web/src/lib/file.ts`) because the file is already in memory there. The preview upload is best effort: if it fails, the RAW file still uploads and its tile shows the failed-load icon.
- The preview's size counts toward the quota check, but not toward stored usage, which comes from the original's size in S3.

## Display (gallery grid and carousel)

```mermaid
flowchart TD
    A["listEventFiles / listSongFiles / getFilesDownloadUrls"] --> B["downloadUrl = signed URL for s3Key"]
    A --> C["createPreviewUrl:<br/>RAW → signed URL for s3Key.preview.jpg<br/>otherwise null"]
    B & C --> D["PreviewImage src = previewUrl ?? downloadUrl"]

    D --> E{"img loads?"}
    E -- yes --> OK[Image shown]
    E -- "no (onError)" --> F{"filename ends in .heic/.heif<br/>and not converted yet?"}
    F -- no --> FAIL["Failed tile: warning icon<br/>(e.g. RAW with no extracted preview)"]
    F -- yes --> G["converting = true → Skeleton"]
    G --> H["fetch original + lazy import heic-to"]
    H --> I["heicTo → JPEG blob → object URL"]
    I --> J{"success?"}
    J -- yes --> OK2["Converted JPEG shown<br/>(blob URL freed on unmount)"]
    J -- no --> FAIL
```

- `PreviewImage` is in `apps/web/src/components/ui/preview-image.tsx`.
- Download buttons always use `downloadUrl`, so users get the original file, never the preview.
- HEIC conversion is triggered by the filename (`/\.hei[cf]$/i`), not the mime type.

## Delete

```mermaid
flowchart LR
    A["deleteFile / deleteFolder / deleteOrganizationFiles<br/>deleteEvent / deleteSong"] --> B["fileObjectKeys(file)"]
    B --> C{"RAW?"}
    C -- yes --> D["delete s3Key<br/>+ s3Key.preview.jpg"]
    C -- no --> E["delete s3Key"]
```

The preview's location is computed from `s3Key` and the mime type, never stored in the database. Any code that deletes S3 objects must go through `fileObjectKeys` so previews aren't left behind.
