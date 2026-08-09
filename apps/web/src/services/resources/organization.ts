import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouterInputs, RouterOutputs } from "@echo/api/router";
import { apiClient } from "@/services/api-client";
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
