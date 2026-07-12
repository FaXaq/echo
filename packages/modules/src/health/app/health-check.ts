import type { KyselyDB } from "@echo/db";
import type { HealthCheckPort } from "../infrastructure/index.js";

export async function healthCheck(deps: { db: KyselyDB; healthCheck: HealthCheckPort }) {
  const dbConnected = await deps.healthCheck.check(deps.db);
  return {
    status: dbConnected ? "ok" : "degraded",
    db: dbConnected,
  } as const;
}
