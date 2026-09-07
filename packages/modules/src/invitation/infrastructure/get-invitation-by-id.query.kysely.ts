import type { GetInvitationByIdQueryPortFactory } from "./get-invitation-by-id.query.port.js";

export const getInvitationByIdQueryFactory: GetInvitationByIdQueryPortFactory =
  () => async (db, input) => {
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
      .where("invitation.id", "=", input.id)
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
  };
