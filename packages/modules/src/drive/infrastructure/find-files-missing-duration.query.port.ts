import type { KyselyDB } from "@echo/db";
import type { FileRecord } from "../domain/index.js";

/**
 * Unscoped by design, unlike every other file query: this backs the one-time
 * CLI duration backfill, which must sweep every organization's files. It is
 * never reachable from a request path. See ADR-0002/0003 for why file access
 * otherwise requires a verified OrganizationScope.
 */
export type FindFilesMissingDurationQueryPort = (db: KyselyDB) => Promise<FileRecord[]>;

export type FindFilesMissingDurationQueryPortFactory = () => FindFilesMissingDurationQueryPort;
