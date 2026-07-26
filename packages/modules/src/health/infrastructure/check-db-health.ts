import { sql } from "kysely";
import type { KyselyDB } from "@echo/db";

export async function checkDbHealth(db: KyselyDB): Promise<boolean> {
  try {
    await sql`SELECT 1`.execute(db);
    return true;
  } catch {
    return false;
  }
}
