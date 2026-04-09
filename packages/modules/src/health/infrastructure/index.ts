import { sql } from "kysely";
import type { KyselyDB } from "@echo/db";

export interface HealthCheckPort {
  check: () => Promise<boolean>;
}

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
