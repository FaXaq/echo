import { sql } from "kysely";
import type { KyselyDB } from "@echo/db";
import type { HealthCheckPort } from "@echo/app";

export const makeHealthRepo = ({ db }: { db: KyselyDB }): HealthCheckPort => ({
  check: async () => {
    try {
      await sql`SELECT 1`.execute(db);
      return true;
    } catch {
      return false;
    }
  },
});
