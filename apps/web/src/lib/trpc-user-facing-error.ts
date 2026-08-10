import type { TRPCClientError } from "@trpc/client";
import { isTRPCClientError } from "@trpc/client";
import type { AppRouter } from "@echo/api/router";
import z from "zod";
import type { TRPC_ERROR_CODE_KEY } from "@trpc/server";

const expectedTRPCCodesSchema = z.enum([
  "BAD_REQUEST",
  "CONFLICT",
  "FORBIDDEN",
  "NOT_FOUND",
  "UNAUTHORIZED",
  "UNPROCESSABLE_CONTENT",
]);

export function getTrpcErrorCode(
  error: TRPCClientError<AppRouter>,
): TRPC_ERROR_CODE_KEY | undefined {
  const fromData = error.data?.code;
  if (typeof fromData === "string") return fromData;
  const fromShape = error.shape?.data?.code;
  if (typeof fromShape === "string") return fromShape;
  return undefined;
}

export function getTrpcProcedurePath(error: TRPCClientError<AppRouter>): string | undefined {
  const path = error.data?.path;
  return typeof path === "string" ? path : undefined;
}

export function isTrpcClientError(error: unknown): error is TRPCClientError<AppRouter> {
  return isTRPCClientError<AppRouter>(error);
}

export function isTrpcErrorCode(
  error: unknown,
  code: TRPC_ERROR_CODE_KEY,
): error is TRPCClientError<AppRouter> {
  return isTrpcClientError(error) && getTrpcErrorCode(error) === code;
}

export function isExpectedUserFacingTrpcError(error: unknown): error is TRPCClientError<AppRouter> {
  if (!isTrpcClientError(error)) return false;
  const trpcCode = getTrpcErrorCode(error);
  if (!trpcCode) return false;
  return expectedTRPCCodesSchema.safeParse(trpcCode.toUpperCase()).success;
}
