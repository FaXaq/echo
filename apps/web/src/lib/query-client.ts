import { QueryClient } from "@tanstack/react-query";
import { isTrpcClientError } from "./trpc-user-facing-error";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (failureCount >= 3) {
          return false;
        }

        if (isTrpcClientError(error)) {
          switch (error.data?.code) {
            case "CONFLICT":
            case "FORBIDDEN":
            case "NOT_FOUND":
            case "UNAUTHORIZED":
            case "UNPROCESSABLE_CONTENT":
            case "INTERNAL_SERVER_ERROR":
              return false;
          }
        }

        return true;
      },
    },
  },
});
