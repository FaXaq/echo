import type { ListUserOrganizationQueryPortFactory } from "./list-user-organizations.query.port";

export const listUserOrganizationsQueryFactory: ListUserOrganizationQueryPortFactory =
  (deps) => async () => {
    const organizations = await deps.auth.api.listOrganizations({
      headers: deps.headers,
    });

    return organizations.map((o) => ({ id: o.id, name: o.name }));
  };
