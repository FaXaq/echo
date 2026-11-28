import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("event_file")
    .addColumn("event_id", "text", (col) =>
      col.notNull().references("calendar_event.id").onDelete("cascade"),
    )
    .addColumn("file_id", "text", (col) => col.notNull().references("file.id").onDelete("cascade"))
    .addColumn("linked_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("linked_by", "text", (col) =>
      col.notNull().references("user.id").onDelete("cascade"),
    )
    .addPrimaryKeyConstraint("event_file_pkey", ["event_id", "file_id"])
    .execute();

  await db.schema
    .createIndex("event_file_file_id_index")
    .on("event_file")
    .column("file_id")
    .execute();

  await db.schema
    .createTable("folder_file")
    .addColumn("file_id", "text", (col) => col.notNull().references("file.id").onDelete("cascade"))
    .addColumn("folder_id", "text", (col) => col.references("folder.id").onDelete("cascade"))
    .addColumn("placed_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("placed_by", "text", (col) =>
      col.notNull().references("user.id").onDelete("cascade"),
    )
    .execute();

  await sql`ALTER TABLE "folder_file" ADD CONSTRAINT "folder_file_file_id_folder_id_key" UNIQUE NULLS NOT DISTINCT ("file_id", "folder_id")`.execute(
    db,
  );

  await db.schema
    .createIndex("folder_file_folder_id_index")
    .on("folder_file")
    .column("folder_id")
    .execute();

  await sql`
    INSERT INTO "event_file" ("event_id", "file_id", "linked_at", "linked_by")
    SELECT "event_id", "id", COALESCE("created_at", now()), "uploaded_by"
    FROM "file"
    WHERE "event_id" IS NOT NULL
  `.execute(db);

  await sql`
    INSERT INTO "folder_file" ("file_id", "folder_id", "placed_at", "placed_by")
    SELECT "id", "folder_id", COALESCE("created_at", now()), "uploaded_by"
    FROM "file"
    WHERE "folder_id" IS NOT NULL
  `.execute(db);

  await sql`
    INSERT INTO "folder_file" ("file_id", "folder_id", "placed_at", "placed_by")
    SELECT f."id", NULL, COALESCE(f."created_at", now()), f."uploaded_by"
    FROM "file" f
    WHERE f."folder_id" IS NULL
      AND f."event_id" IS NULL
      AND NOT EXISTS (SELECT 1 FROM "song_file" sf WHERE sf."file_id" = f."id")
  `.execute(db);

  await db.schema.alterTable("file").dropColumn("event_id").execute();
  await db.schema.alterTable("file").dropColumn("folder_id").execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("file")
    .addColumn("event_id", "text", (col) =>
      col.references("calendar_event.id").onDelete("set null"),
    )
    .execute();
  await db.schema
    .alterTable("file")
    .addColumn("folder_id", "text", (col) => col.references("folder.id").onDelete("set null"))
    .execute();

  await db.schema.createIndex("file_folder_id_index").on("file").column("folder_id").execute();

  await sql`
    UPDATE "file" f
    SET "event_id" = (SELECT min(ef."event_id") FROM "event_file" ef WHERE ef."file_id" = f."id")
  `.execute(db);

  await sql`
    UPDATE "file" f
    SET "folder_id" = (
      SELECT min(ff."folder_id") FROM "folder_file" ff
      WHERE ff."file_id" = f."id" AND ff."folder_id" IS NOT NULL
    )
  `.execute(db);

  await db.schema.dropTable("folder_file").execute();
  await db.schema.dropTable("event_file").execute();
}
