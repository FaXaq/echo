import { sql } from "kysely";
import type { HealthCheckPort } from "./health-repository.port.js";

export const makeHealthRepo = (): HealthCheckPort => ({
  check: async (db) => {
    try {
      await sql`SELECT 1`.execute(db);
      return true;
    } catch {
      return false;
    }
  },
});
