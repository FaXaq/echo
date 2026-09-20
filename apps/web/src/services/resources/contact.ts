import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouterOutputs } from "@echo/api/router";
import { apiClient } from "@/services/api-client";
import { initResourceKey } from "./init-resource-key";

const { key, getResourceKey } = initResourceKey("contact");

export { key };

export type Contact = RouterOutputs["contact"]["list"][number];

export function listContactsQueryOptions(opts: { organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("list", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.contact.list.query(params, { signal });
    },
  });
}

export function useCreateContactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      organizationId: string;
      name: string;
      phone?: string;
      email?: string;
      description?: string;
    }) => apiClient.contact.create.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
