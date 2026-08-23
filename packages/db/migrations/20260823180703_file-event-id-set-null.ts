import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE "file" DROP CONSTRAINT "file_event_id_fkey"`.execute(db);
  await sql`ALTER TABLE "file" ADD CONSTRAINT "file_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_event"("id") ON DELETE SET NULL`.execute(
    db,
  );
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE "file" DROP CONSTRAINT "file_event_id_fkey"`.execute(db);
  await sql`ALTER TABLE "file" ADD CONSTRAINT "file_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_event"("id") ON DELETE CASCADE`.execute(
    db,
  );
}
