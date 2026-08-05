import { queryOptions } from "@tanstack/react-query";
import type { RouterOutputs } from "@echo/api/router";
import { apiClient } from "@/services/api-client";
import { initResourceKey } from "./init-resource-key";

const { key, getResourceKey } = initResourceKey("invitation");

export { key };

export type Invitation = RouterOutputs["invitation"]["get"];

export function getInvitationQueryOptions(opts: { id: string }) {
  return queryOptions({
    queryKey: getResourceKey("get", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.invitation.get.query(params, { signal });
    },
  });
}
