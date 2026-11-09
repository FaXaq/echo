import type { KyselyDB } from "@echo/db";

/**
 * Unscoped by design, like FindFilesMissingThumbnailQueryPort: backs the CLI
 * thumbnail backfill only, never reachable from a request path.
 */
export type MarkFileHasThumbnailCommandPort = (
  db: KyselyDB,
  input: { id: string },
) => Promise<void>;

export type MarkFileHasThumbnailCommandPortFactory = () => MarkFileHasThumbnailCommandPort;
