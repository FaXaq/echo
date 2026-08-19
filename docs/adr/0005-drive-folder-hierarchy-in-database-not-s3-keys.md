# Drive folder hierarchy lives in a database table, not S3 key prefixes

S3 general-purpose buckets have no folder rename/move API — "folders" are either a display convenience computed from `Prefix`/`Delimiter` at list time or a 0-byte marker object, and changing one means copying every nested object to a new key and deleting the old one: non-atomic and O(N) in object count (see `docs/research/s3-drive-directory-structure.md`). We model the Drive folder hierarchy as a self-referencing `folder` table (`organizationId`, `parentFolderId`, `name`) with a nullable `file.folderId` FK, and keep the existing ID-based `s3Key` (`org/{organizationId}/{fileId}/{filename}`) completely decoupled from folder path — `folderId` is pure metadata, never reflected in the S3 key. Create/rename/move/delete on folders are therefore plain DB writes with zero S3 calls, the same pattern this module already uses for filename renames (`rename-file.ts` never touches S3).

## Considered Options

Encoding the folder path into the S3 key (`org/{organizationId}/{path}/{filename}`) was rejected: it would make every folder rename or move an expensive, non-atomic copy+delete storm across all nested objects, and S3's own docs state console-created folders "can't be renamed."
