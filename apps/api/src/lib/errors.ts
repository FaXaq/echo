import { AppError } from "@echo/errors";
import { makeLogger } from "@echo/logger";
import { TRPCError } from "@trpc/server";

export const appErrorToTRPC = (e: unknown): TRPCError => {
  const logger = makeLogger();
  if (!(e instanceof AppError)) {
    logger.error({ error: e, code: "UNKNOWN_ERROR" }, "[tRPC]: UNKNOWN_ERROR");
    return new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  }

  logger.error({ error: e, code: e.type }, `[tRPC]: ${e.type}`);

  switch (e.type) {
    case "NOT_FOUND":
      return new TRPCError({ code: "NOT_FOUND", message: e.message });
    case "CONFLICT":
      return new TRPCError({ code: "CONFLICT", message: e.message });
    case "UNAUTHORIZED":
      return new TRPCError({ code: "UNAUTHORIZED", message: e.message });
    case "FORBIDDEN":
      return new TRPCError({ code: "FORBIDDEN", message: e.message });
    case "DATA_VALIDATION_FAILED":
      return new TRPCError({ code: "BAD_REQUEST", message: e.message });
    case "QUOTA_EXCEEDED":
      return new TRPCError({ code: "FORBIDDEN", message: e.message, cause: e });
    case "DATABASE_ERROR":
    default:
      return new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  }
};
