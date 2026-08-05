import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@echo/api/router";

export const apiClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/trpc",
      fetch: (url, options) => fetch(url, { ...options, credentials: "include" }),
    }),
  ],
});
