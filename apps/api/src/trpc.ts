import { initTRPC, TRPCError } from "@trpc/server";
import { systemRole, type ServerSession } from "@echo/auth";
import type { makeDbAdapter } from "@echo/db";
import type { makeLogger } from "@echo/logger";
import type { InvitationRepoPort } from "@echo/modules/invitation/infrastructure";
import type { EmailNotifierPort } from "@echo/modules/notification/infrastructure";
import type { makeHealthRepo } from "@echo/modules/health/infrastructure";
import type { makeSongRepo } from "@echo/modules/song/infrastructure";
import type { makeTrackRepo } from "@echo/modules/track/infrastructure";
import type { makeAudioClipRepo } from "@echo/modules/audio-clip/infrastructure";
import type { makeMidiClipRepo } from "@echo/modules/midi-clip/infrastructure";
import type { makeFileRepo, FileStoragePort } from "@echo/modules/file/infrastructure";
import type { makeSongSectionDefinitionRepo, makeSongSectionInstanceRepo } from "@echo/modules/song-section/infrastructure";
import type { makeOrganizationRepo } from "@echo/modules/organization/infrastructure";
import type { makeUserPermissionRepo } from "@echo/modules/user/infrastructure";
import { appErrorToTRPC } from "./lib/errors";

export type Context = {
  session: ServerSession | null;
  headers: Headers;
  db: ReturnType<typeof makeDbAdapter>["db"];
  pool: ReturnType<typeof makeDbAdapter>["pool"];
  health: ReturnType<typeof makeHealthRepo>;
  logger: ReturnType<typeof makeLogger>;
  invitation: InvitationRepoPort;
  notifiers: {
    email: EmailNotifierPort;
  };
  song: ReturnType<typeof makeSongRepo>;
  track: ReturnType<typeof makeTrackRepo>;
  audioClip: ReturnType<typeof makeAudioClipRepo>;
  midiClip: ReturnType<typeof makeMidiClipRepo>;
  file: ReturnType<typeof makeFileRepo>;
  fileStorage: FileStoragePort;
  organization: ReturnType<typeof makeOrganizationRepo>;
  userPermission: ReturnType<typeof makeUserPermissionRepo>;
  songSectionDefinition: ReturnType<typeof makeSongSectionDefinitionRepo>;
  songSectionInstance: ReturnType<typeof makeSongSectionInstanceRepo>;
};

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const mergeRouters = t.mergeRouters;

const appErrorMiddleware = t.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    throw appErrorToTRPC(err);
  }
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
