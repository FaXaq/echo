import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    INSERT INTO "song_file" ("song_id", "file_id", "role", "linked_at", "linked_by")
    SELECT "song_id", "id", NULL, COALESCE("created_at", now()), "uploaded_by"
    FROM "file"
    WHERE "song_id" IS NOT NULL
  `.execute(db);
}

export async function down(): Promise<void> {}
