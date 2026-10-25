import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type UpdateSongScoreInput = { id: string; userId: string; score: string };

export type UpdateSongScoreCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: UpdateSongScoreInput,
) => Promise<boolean>;

export type UpdateSongScoreCommandPortFactory = () => UpdateSongScoreCommandPort;
