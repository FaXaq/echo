import type { KyselyDB } from "@echo/db";
import type { FileRecord } from "../domain/index.js";

/**
 * Unscoped by design, like FindFilesMissingThumbnailQueryPort: backs the CLI
 * dimensions backfill only, never reachable from a request path.
 */
export type FindFilesMissingDimensionsQueryPort = (db: KyselyDB) => Promise<FileRecord[]>;

export type FindFilesMissingDimensionsQueryPortFactory = () => FindFilesMissingDimensionsQueryPort;
