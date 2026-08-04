import type { ServerAuth } from "@echo/auth";
import type { Organization } from "../domain";

export type ListUserOrganizationQueryPort = () => Promise<Organization[]>;
export type ListUserOrganizationQueryPortFactory = (
  deps: { auth: ServerAuth; headers: Headers },
) => ListUserOrganizationQueryPort;
