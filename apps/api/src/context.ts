import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import type { ServerAuth } from "@echo/auth";
import { makeInvitationRepo } from "./adapters/invitation";
import { makeDbAdapter } from "@echo/db";
import { appConfig } from "./adapters/config/index";
import { makeHealthRepo } from "./adapters/health";
import { makeMailer } from "./adapters/mailer/mailer";
import { makeLogger } from "@echo/logger";
import type { Context } from "./trpc";
import { makeUserPermissionRepo } from "./adapters/auth/user-permission";
import { makeEmailNotifierRepo } from "./adapters/email-notifier";
import { makeSongRepo } from "./adapters/song";
import { makeTrackRepo } from "./adapters/track";
import { makeAudioClipRepo } from "./adapters/audio-clip";
import { makeFileStorageAdapter } from "./adapters/file-storage";
import { makeOrganizationRepo } from "./adapters/organization";

// Singletons — created once at startup
const { db, pool } = makeDbAdapter(appConfig.db);
const logger = makeLogger();
const mailer = makeMailer(appConfig.mailer);
const fileStorage = makeFileStorageAdapter(appConfig.s3);

export const makeCreateContext =
  (auth: ServerAuth) =>
    async ({ req }: CreateFastifyContextOptions): Promise<Context> => {
      const headers = new Headers();
      Object.entries(req.headers).forEach(([key, value]) => {
        if (value)
          headers.append(key, Array.isArray(value) ? value[0] : value.toString());
      });
      const session = await auth.api.getSession({ headers });

      const health = makeHealthRepo({ db });
      const invitation = makeInvitationRepo({ db });
      const song = makeSongRepo({ db });
      const track = makeTrackRepo({ db });
      const audioClip = makeAudioClipRepo({ db });
      const organization = makeOrganizationRepo({ headers });
      const userPermission = makeUserPermissionRepo({
        userId: session?.user.id,
        headers
      });
      const notifiers = {
        email: makeEmailNotifierRepo({
          mailer: mailer,
          appBaseUrl: appConfig.appBaseUrl,
        }),
      };

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
        song,
        track,
        audioClip,
        fileStorage,
        organization,
      };
    };
