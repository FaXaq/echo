import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  // 1. Create file table
  await db.schema
    .createTable("file")
    .addColumn("id", "varchar", (col) => col.primaryKey().notNull())
    .addColumn("storageKey", "varchar", (col) => col.notNull().unique())
    .addColumn("filename", "varchar", (col) => col.notNull())
    .addColumn("type", "varchar", (col) => col.notNull())
    .addColumn("organizationId", "varchar", (col) =>
      col.notNull().references("organization.id").onDelete("restrict"),
    )
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  // 2. Add fileId column to audioClip (nullable initially for data migration)
  await db.schema
    .alterTable("audioClip")
    .addColumn("fileId", "varchar", (col) =>
      col.references("file.id").onDelete("restrict"),
    )
    .execute();

  // 3. Migrate existing rows: create a file record per audioClip (join track→song to get organizationId)
  await sql`
    INSERT INTO "file" ("id", "storageKey", "filename", "type", "organizationId", "createdAt")
    SELECT gen_random_uuid()::varchar, ac."storageKey", ac."filename", 'audio', s."organizationId", ac."createdAt"
    FROM "audioClip" ac
    JOIN "track" t ON t.id = ac."trackId"
    JOIN "song" s ON s.id = t."songId"
  `.execute(db);

  await sql`
    UPDATE "audioClip" ac
    SET "fileId" = f."id"
    FROM "file" f
    WHERE f."storageKey" = ac."storageKey"
  `.execute(db);

  // 4. Make fileId NOT NULL now that all rows are populated
  await db.schema
    .alterTable("audioClip")
    .alterColumn("fileId", (col) => col.setNotNull())
    .execute();

  // 5. Drop old columns from audioClip (keep durationMs)
  await db.schema.alterTable("audioClip").dropColumn("filename").execute();
  await db.schema.alterTable("audioClip").dropColumn("storageKey").execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("audioClip")
    .addColumn("filename", "varchar")
    .execute();
  await db.schema
    .alterTable("audioClip")
    .addColumn("storageKey", "varchar")
    .execute();

  // Restore data from file
  await sql`
    UPDATE "audioClip" ac
    SET "filename" = f."filename", "storageKey" = f."storageKey"
    FROM "file" f WHERE f."id" = ac."fileId"
  `.execute(db);

  await db.schema.alterTable("audioClip").dropColumn("fileId").execute();
  await db.schema.dropTable("file").execute();
}
