import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type SongExistsInOrganizationInput = { songId: string };

export type SongExistsInOrganizationQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: SongExistsInOrganizationInput,
) => Promise<boolean>;

export type SongExistsInOrganizationQueryPortFactory = () => SongExistsInOrganizationQueryPort;
