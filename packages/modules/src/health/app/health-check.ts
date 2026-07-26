import type { KyselyDB } from "@echo/db";
import { checkDbHealth } from "../infrastructure/index.js";

export async function healthCheck(deps: { db: KyselyDB }) {
  const dbConnected = await checkDbHealth(deps.db);
  return {
    status: dbConnected ? "ok" : "degraded",
    db: dbConnected,
  } as const;
}
