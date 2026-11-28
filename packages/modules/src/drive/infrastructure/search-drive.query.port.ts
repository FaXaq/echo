import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { DriveLocation, FileRecord, Place } from "../domain/index.js";

export type SearchDriveQueryInput = { query: string };

export type SearchDriveResult = {
  folders: { location: DriveLocation; name: string; path: string[] }[];
  files: (FileRecord & { location: Place; path: string[] })[];
};

export type SearchDriveQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: SearchDriveQueryInput,
) => Promise<SearchDriveResult>;

export type SearchDriveQueryPortFactory = () => SearchDriveQueryPort;
