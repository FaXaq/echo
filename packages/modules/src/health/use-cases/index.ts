import type { HealthCheckPort } from "../infrastructure/index.js";

export const makeHealthCheck =
  (deps: { healthCheck: HealthCheckPort }) => async () => {
    const dbConnected = await deps.healthCheck.check();
    return {
      status: dbConnected ? "ok" : "degraded",
      db: dbConnected,
    } as const;
  };

export type HealthCheck = ReturnType<typeof makeHealthCheck>;
