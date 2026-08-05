import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@echo/api/router";
import { apiClient } from "@/services/api-client";

export const trpc = createTRPCReact<AppRouter>();

/** @deprecated Use `apiClient` from `@/services/api-client` in resource modules and new route code. */
export const trpcLoader = apiClient;
