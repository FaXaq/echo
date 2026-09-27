import type { KyselyDB } from "@echo/db";

export type UpdateFileDurationByIdInput = {
  id: string;
  durationSeconds: number;
};

/**
 * Unscoped by design, like FindFilesMissingDurationQueryPort: backs the
 * one-time CLI duration backfill only, never reachable from a request path.
 */
export type UpdateFileDurationByIdCommandPort = (
  db: KyselyDB,
  input: UpdateFileDurationByIdInput,
) => Promise<void>;

export type UpdateFileDurationByIdCommandPortFactory = () => UpdateFileDurationByIdCommandPort;
