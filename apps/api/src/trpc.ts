import { initTRPC, TRPCError } from "@trpc/server";
import { systemRole, type ServerSession } from "@echo/auth";
import type { InvitationRepoPort } from "@echo/app";
import type { makeDbAdapter } from "@echo/db";
import type { makeHealthRepo } from "./adapters/health";
import type { makeLogger } from "@echo/logger";
import type {
  EmailNotifierPort,
} from "@echo/app/ports";
import type { makeSongRepo } from "./adapters/song";
import type { makeTrackRepo } from "./adapters/track";
import type { makeAudioClipRepo } from "./adapters/audio-clip";
import type { makeMidiClipRepo } from "./adapters/midi-clip";
import type { makeFileRepo } from "./adapters/file";
import type { makeOrganizationRepo } from "./adapters/organization";
import type { makeUserPermissionRepo } from "./adapters/auth/user-permission";
import type { FileStoragePort } from "@echo/app";
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
