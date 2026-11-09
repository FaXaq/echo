import type { KyselyDB } from "@echo/db";
import type { FileRecord } from "../domain/index.js";

/**
 * Unscoped by design, unlike every other file query: this backs the CLI
 * thumbnail backfill, which must sweep every organization's files. It is
 * never reachable from a request path. See ADR-0002/0003 for why file access
 * otherwise requires a verified OrganizationScope.
 */
export type FindFilesMissingThumbnailQueryPort = (db: KyselyDB) => Promise<FileRecord[]>;

export type FindFilesMissingThumbnailQueryPortFactory = () => FindFilesMissingThumbnailQueryPort;
