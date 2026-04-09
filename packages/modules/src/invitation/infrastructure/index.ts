import type { KyselyDB } from "@echo/db";
import type { InvitationDetails } from "../domain/index.js";

export type { InvitationDetails };

export interface InvitationRepoPort {
  getById: (id: string) => Promise<InvitationDetails | null>;
}

export const makeInvitationRepo = ({
  db,
}: {
  db: KyselyDB;
}): InvitationRepoPort => ({
  getById: async (id) => {
    const row = await db
      .selectFrom("invitation")
      .leftJoin("organization", "organization.id", "invitation.organizationId")
      .select([
        "invitation.id",
        "invitation.email",
        "invitation.role",
        "invitation.status",
        "invitation.expiresAt",
        "organization.name as orgName",
        "organization.slug as orgSlug",
      ])
      .where("invitation.id", "=", id)
      .executeTakeFirst();

    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.status,
      expiresAt: row.expiresAt,
      organizationName: row.orgName,
      organizationSlug: row.orgSlug,
    };
  },
});
