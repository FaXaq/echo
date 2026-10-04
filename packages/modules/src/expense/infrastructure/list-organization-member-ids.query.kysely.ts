import type { ListOrganizationMemberIdsQueryPortFactory } from "./list-organization-member-ids.query.port.js";

export const listOrganizationMemberIdsQueryFactory: ListOrganizationMemberIdsQueryPortFactory =
  () => async (db, scope) => {
    const rows = await db
      .selectFrom("member")
      .select("userId")
      .where("organizationId", "=", scope.organizationId)
      .execute();
    return rows.map((row) => row.userId);
  };
