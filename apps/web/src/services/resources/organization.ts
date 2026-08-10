import { queryOptions } from "@tanstack/react-query";
import type { RouterOutputs } from "@echo/api/router";
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
