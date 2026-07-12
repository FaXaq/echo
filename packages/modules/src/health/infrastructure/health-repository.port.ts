import type { KyselyDB } from "@echo/db";

export interface HealthCheckPort {
  check: (db: KyselyDB) => Promise<boolean>;
}
