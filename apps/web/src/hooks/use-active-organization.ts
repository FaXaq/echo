import { authClient } from "@/lib/auth";
import { useSession } from "./use-session";

export const useActiveOrganization = () => {
  const { session } = useSession();
  const { data: organizations } = authClient.useListOrganizations();
  const activeOrganizationId = session.session.activeOrganizationId;
  const activeOrganization = organizations?.find((o) => o.id === activeOrganizationId) ?? null;

  return { activeOrganization, setActiveOrganization: authClient.organization.setActive };
};
