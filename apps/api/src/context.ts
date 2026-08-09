import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import type { ServerAuth } from "@echo/auth";
import { makeDbAdapter } from "@echo/db";
import { appConfig } from "./adapters/config/index";
import { makeLogger } from "@echo/logger";
import type { Context } from "./trpc";
import {
  userHasPermission,
  userHasPermissionInOrganization,
} from "@echo/modules/user/infrastructure";
import { makeMailer } from "@echo/adapters/mailer";
import { makeS3Storage } from "@echo/adapters/s3-storage";
import { makeGeocoding } from "@echo/adapters/geocoding";

// Singletons — created once at startup
const { db, pool } = makeDbAdapter(appConfig.db);
const logger = makeLogger();
const mailer = makeMailer(appConfig.mailer);
const geocoding = makeGeocoding(appConfig.mapbox);

export const makeCreateContext =
  (auth: ServerAuth) =>
  async ({ req }: CreateFastifyContextOptions): Promise<Context> => {
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) headers.append(key, Array.isArray(value) ? value[0] : value.toString());
    });
    const session = await auth.api.getSession({ headers });

    const s3Storage = makeS3Storage(appConfig.s3);

    return {
      session,
      db,
      pool,
      headers,
      logger,
      mailer,
      userHasPermission: (input) => userHasPermission({ auth, userId: session?.user.id }, input),
      userHasPermissionInOrganization: (input) =>
        userHasPermissionInOrganization({ auth, userId: session?.user.id, headers }, input),
      s3Storage,
      geocoding,
      auth,
    };
  };
