import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import type { ServerAuth } from "@echo/auth";
import { makeDbAdapter } from "@echo/db";
import { appConfig } from "./adapters/config/index";
import { makeLogger } from "@echo/logger";
import type { Context } from "./trpc";
import { makeHealthRepo } from "@echo/modules/health/infrastructure";
import { makeInvitationRepo } from "@echo/modules/invitation/infrastructure";
import { makeOrganizationRepo } from "@echo/modules/organization/infrastructure";
import { makeUserPermissionRepo } from "@echo/modules/user/infrastructure";
import { makeEmailNotifierRepo, makeMailer } from "@echo/modules/notification/infrastructure";
import { makeFileRepo, makeS3Storage } from "@echo/modules/file/infrastructure";

// Singletons — created once at startup
const { db, pool } = makeDbAdapter(appConfig.db);
const logger = makeLogger();
const mailer = makeMailer(appConfig.mailer);

export const makeCreateContext =
  (auth: ServerAuth) =>
    async ({ req }: CreateFastifyContextOptions): Promise<Context> => {
      const headers = new Headers();
      Object.entries(req.headers).forEach(([key, value]) => {
        if (value)
          headers.append(key, Array.isArray(value) ? value[0] : value.toString());
      });
      const session = await auth.api.getSession({ headers });

      const health = makeHealthRepo();
      const invitation = makeInvitationRepo();
      const organization = makeOrganizationRepo({ auth, headers });
      const userPermission = makeUserPermissionRepo({
        auth,
        userId: session?.user.id,
        headers,
      });
      const notifiers = {
        email: makeEmailNotifierRepo({
          mailer: mailer,
          appBaseUrl: appConfig.appBaseUrl,
        }),
      };
      const fileRepo = makeFileRepo();
      const s3Storage = makeS3Storage(appConfig.s3);

      return {
        session,
        db,
        pool,
        headers,
        health,
        logger,
        invitation,
        notifiers,
        userPermission,
        organization,
        fileRepo,
        s3Storage,
      };
    };
