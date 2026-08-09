import type { ListUserOrganizationQueryPort } from "../infrastructure/list-user-organizations.query.port";

export async function selfListOrganizations(deps: {
  listUserOrganizationsQuery: ListUserOrganizationQueryPort;
}) {
  return await deps.listUserOrganizationsQuery();
}
