import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export const songColumns = [
  "song.id",
  "song.title",
  "song.artist",
  "song.bpm",
  "song.key",
  "song.lyrics",
  "song.type",
  "song.time_signature",
  "song.organization_id",
  "song.created_at",
  "song.created_by",
  "song.updated_at",
  "song.updated_by",
] as const;

export const makeSelectSongByIdQuery = (db: KyselyDB) => (scope: OrganizationScope, id: string) => {
  return db
    .selectFrom("song")
    .innerJoin("user", "user.id", "song.created_by")
    .select(songColumns)
    .select("user.name as created_by_name")
    .innerJoin("organization", "song.organization_id", "organization.id")
    .select(["organization.name as organization_name", "organization.slug as organization_slug"])
    .where("song.id", "=", id)
    .where("song.organization_id", "=", scope.organizationId)
    .executeTakeFirstOrThrow();
};
