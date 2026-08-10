import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import type { authClient } from "./lib/auth";
import type { queryClient } from "./lib/query-client";

export interface MyRouterContext {
  auth: typeof authClient;
  queryClient: typeof queryClient;
}

export const router = createRouter({
  routeTree,
  context: {
    auth: undefined!, // This will be injected in the App component
    queryClient: undefined!, // This will be injected in the App component
  },
});

// Register for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }

  interface StaticDataRouteOption {
    title?: string;
    breadcrumb?: string;
  }
}
