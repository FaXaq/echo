import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE "song" DROP CONSTRAINT "song_updated_by_fkey"`.execute(db);
  await sql`ALTER TABLE "song" ADD CONSTRAINT "song_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL`.execute(
    db,
  );
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE "song" DROP CONSTRAINT "song_updated_by_fkey"`.execute(db);
  await sql`ALTER TABLE "song" ADD CONSTRAINT "song_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE CASCADE`.execute(
    db,
  );
}
