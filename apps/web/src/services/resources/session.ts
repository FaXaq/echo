import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { organizationRoleSchema } from "@echo/auth";
import { authClient } from "@/lib/auth";
import { initResourceKey } from "./init-resource-key";

const { key, getResourceKey } = initResourceKey("session");

export { key };

/** Current authenticated session (better-auth). Returns `null` when signed out. */
export function getSessionQueryOptions() {
  return queryOptions({
    queryKey: getResourceKey("getSession", undefined),
    queryFn: async () => {
      const { data, error } = await authClient.getSession();
      if (error) throw new Error(`Failed to fetch session: ${error.message}`);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Active-organization membership role for the signed-in user. */
export function getActiveMemberRoleQueryOptions(opts: { organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("getActiveMemberRole", opts),
    queryFn: async () => {
      const { data, error } = await authClient.organization.getActiveMemberRole();
      if (error) throw notFound();
      const role = organizationRoleSchema.parse(data.role);
      return { ...data, role };
    },
    staleTime: 5 * 60 * 1000,
  });
}
