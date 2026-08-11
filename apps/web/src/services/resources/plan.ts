import { queryOptions } from "@tanstack/react-query";
import type { RouterOutputs } from "@echo/api/router";
import { apiClient } from "@/services/api-client";
import { initResourceKey } from "./init-resource-key";

const { key, getResourceKey } = initResourceKey("plan");

export { key };

export type PlanOverview = RouterOutputs["organization"]["plan"]["overview"];

export function getPlanOverviewQueryOptions(opts: { organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("overview", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.organization.plan.overview.query(params, { signal });
    },
    staleTime: 60 * 1000,
  });
}
