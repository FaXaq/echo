import { sql } from "kysely";
import type { GetOrganizationSeatUsageQueryPortFactory } from "./get-organization-seat-usage.query.port.js";

export const getOrganizationSeatUsageQueryFactory: GetOrganizationSeatUsageQueryPortFactory =
  () => async (db, scope, input) => {
    const members = await db
      .selectFrom("member")
      .select(sql<string>`count(*)`.as("total"))
      .where("organizationId", "=", scope.organizationId)
      .executeTakeFirst();

    let invitationsQuery = db
      .selectFrom("invitation")
      .select(sql<string>`count(*)`.as("total"))
      .where("organizationId", "=", scope.organizationId)
      .where("status", "=", "pending")
      .where("expiresAt", ">", new Date());

    if (input?.excludeInvitationId) {
      invitationsQuery = invitationsQuery.where("id", "!=", input.excludeInvitationId);
    }

    const invitations = await invitationsQuery.executeTakeFirst();

    return Number(members?.total ?? 0) + Number(invitations?.total ?? 0);
  };
