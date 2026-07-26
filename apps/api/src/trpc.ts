import { initTRPC, TRPCError } from "@trpc/server";
import { AppError } from "@echo/errors";
import { systemRole, type ServerSession } from "@echo/auth";
import type { makeDbAdapter } from "@echo/db";
import type { makeLogger } from "@echo/logger";
import type {
  CheckOrganizationPermission,
  CheckUserPermission,
} from "@echo/modules/user/infrastructure";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import type { MailerPort } from "@echo/adapters/mailer";
import { appErrorToTRPC } from "./lib/errors";

export type Context = {
  session: ServerSession | null;
  headers: Headers;
  db: ReturnType<typeof makeDbAdapter>["db"];
  pool: ReturnType<typeof makeDbAdapter>["pool"];
  logger: ReturnType<typeof makeLogger>;
  mailer: MailerPort;
  userHasPermission: CheckUserPermission;
  userHasPermissionInOrganization: CheckOrganizationPermission;
  s3Storage: S3StoragePort;
};

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const mergeRouters = t.mergeRouters;

const appErrorMiddleware = t.middleware(async ({ next }) => {
  const result = await next();
  if (result.ok) return result;
  if (result.error.cause instanceof AppError) {
    throw appErrorToTRPC(result.error.cause);
  }
  return result;
});

export const publicProcedure = t.procedure.use(appErrorMiddleware);


export const authedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, session: ctx.session } });
});

export const adminProcedure = authedProcedure.use(({ ctx, next }) => {
  if (ctx.session.user.role !== systemRole.admin)
    throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});
