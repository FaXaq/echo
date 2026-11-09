import type { KyselyDB } from "@echo/db";

/**
 * Unscoped by design, like FindFilesMissingDimensionsQueryPort: backs the CLI
 * dimensions backfill only, never reachable from a request path.
 */
export type UpdateFileDimensionsByIdCommandPort = (
  db: KyselyDB,
  input: { id: string; width: number; height: number },
) => Promise<void>;

export type UpdateFileDimensionsByIdCommandPortFactory = () => UpdateFileDimensionsByIdCommandPort;
