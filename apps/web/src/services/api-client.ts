import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@echo/api/router";
import { apiUrl } from "@/lib/api-url";

export const apiClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${apiUrl}/trpc`,
      fetch: (url, options) => fetch(url, { ...options, credentials: "include" }),
    }),
  ],
});
