import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouterInputs, RouterOutputs } from "@echo/api/router";
import { apiClient } from "@/services/api-client";
import { authClient } from "@/lib/auth";
import { initResourceKey } from "./init-resource-key";

const { key, getResourceKey } = initResourceKey("organization");

export { key };

export type Organizations = RouterOutputs["organization"]["selfList"];

export function selfListOrganizations() {
  return queryOptions({
    queryKey: getResourceKey("selfList", {}),
    queryFn: async ({ signal }) => {
      return apiClient.organization.selfList.query(undefined, { signal });
    },
  });
}

export function getFullOrganizationQueryOptions(opts: { organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("getFullOrganization", opts),
    queryFn: async () => {
      const { data, error } = await authClient.organization.getFullOrganization({
        query: { organizationId: opts.organizationId, membersLimit: 0 },
      });
      if (error) throw new Error(`Failed to fetch organization: ${error.message}`);
      return data;
    },
  });
}

export type CreateOrganizationInput = RouterInputs["organization"]["create"];
export function useCreateOrganizationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => apiClient.organization.create.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export type UpdateOrganizationInput = { organizationId: string; name: string };
export function useUpdateOrganizationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, name }: UpdateOrganizationInput) => {
      const { data, error } = await authClient.organization.update({
        organizationId,
        data: { name },
      });
      if (error) throw new Error(error.message ?? "Failed to update organization");
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useDeleteOrganizationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (opts: { organizationId: string }) => {
      const { error } = await authClient.organization.delete({
        organizationId: opts.organizationId,
      });
      if (error) throw new Error(error.message ?? "Failed to delete organization");
    },
    onSuccess: (_data, { organizationId }) => {
      // Evict the deleted org's own detail query instead of invalidating it: it's gone, so
      // refetching would just retry against a 404 and stall callers awaiting this mutation.
      queryClient.removeQueries({
        queryKey: getResourceKey("getFullOrganization", { organizationId }),
      });
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
