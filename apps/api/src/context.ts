import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import type { ServerAuth } from "@echo/auth";
import { makeDbAdapter } from "@echo/db";
import { appConfig } from "./adapters/config/index";
import { makeLogger } from "@echo/logger";
import type { Context } from "./trpc";
import { makeHealthRepo } from "@echo/modules/health/infrastructure";
import { makeInvitationRepo } from "@echo/modules/invitation/infrastructure";
import { makeSongRepo } from "@echo/modules/song/infrastructure";
import { makeTrackRepo } from "@echo/modules/track/infrastructure";
import { makeAudioClipRepo } from "@echo/modules/audio-clip/infrastructure";
import { makeMidiClipRepo } from "@echo/modules/midi-clip/infrastructure";
import { makeFileRepo, makeFileStorageAdapter } from "@echo/modules/file/infrastructure";
import { makeOrganizationRepo } from "@echo/modules/organization/infrastructure";
import { makeUserPermissionRepo } from "@echo/modules/user/infrastructure";
import { makeEmailNotifierRepo, makeMailer } from "@echo/modules/notification/infrastructure";

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
      const midiClip = makeMidiClipRepo({ db });
      const file = makeFileRepo({ db });
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
        midiClip,
        file,
        fileStorage,
        organization,
      };
    };
