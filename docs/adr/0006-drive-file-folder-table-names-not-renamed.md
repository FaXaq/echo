# `file`/`folder` DB table names not renamed to match the `drive` module

ECH-63 renames the `file` module, its package export paths, its Better Auth permission resource, and the tRPC/frontend wire layer to `drive`, catching the code up to the "Drive" term already defined in `packages/modules/CONTEXT.md`. The `file` and `folder` Postgres tables are deliberately left as-is: table names are a storage detail, not domain vocabulary a caller depends on, and renaming them would mean a migration touching FK constraint names (`file.folder_id → folder.id`), index names, and regenerated Kysely types for zero behavioral or domain-clarity gain. `File` and `Folder` also remain valid entity-level terms *within* the Drive module (see ADR-0005), so the table names still describe what they hold — only the bounded-context wrapper around them is renamed.

## Considered Options

Renaming the tables to `drive_file`/`drive_folder` (or similar) for full naming consistency with the module was rejected: it adds real migration risk (constraint/index renames, generated-type churn) with no reader ever encountering the table name outside `packages/db/`.
