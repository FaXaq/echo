import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type GetSongScoreQueryInput = { songId: string };

export type GetSongScoreQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: GetSongScoreQueryInput,
) => Promise<{ title: string; score: string | null } | null>;

export type GetSongScoreQueryPortFactory = () => GetSongScoreQueryPort;
