import { z } from "zod";
import { router, authedProcedure } from "../../trpc";
import {
  listAudioClips,
  getUploadUrl,
  registerAudioClip,
  updateAudioClipPosition,
  deleteAudioClip,
  deleteManyAudioClips,
  getSignedUrls,
  renameAudioClip,
} from "@echo/modules/audio-clip/app";

export const makeAudioClipRouter = () =>
  router({
    listBySong: authedProcedure
      .input(z.object({ songId: z.string().min(1) }))
      .query(async ({ input, ctx }) => {
        return listAudioClips({ db: ctx.db, audioClipRepo: ctx.audioClip }, {
          songId: input.songId,
        });
      }),

    getUploadUrl: authedProcedure
      .input(
        z.object({
          filename: z.string().min(1),
          contentType: z.string().min(1),
          organizationId: z.string().min(1),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return getUploadUrl({ fileStorage: ctx.fileStorage }, {
          filename: input.filename,
          contentType: input.contentType,
          organizationId: input.organizationId,
        });
      }),

    register: authedProcedure
      .input(
        z.object({
          trackId: z.string().min(1),
          filename: z.string().min(1),
          storageKey: z.string().min(1),
          organizationId: z.string().min(1),
          startMeasure: z.number().positive(),
          durationMs: z.number().int().positive().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return registerAudioClip(
          { db: ctx.db, audioClipRepo: ctx.audioClip, fileRepo: ctx.file },
          {
            trackId: input.trackId,
            filename: input.filename,
            storageKey: input.storageKey,
            organizationId: input.organizationId,
            startMeasure: input.startMeasure,
            durationMs: input.durationMs,
          },
        );
      }),

    updatePosition: authedProcedure
      .input(
        z.object({
          clipId: z.string().min(1),
          startMeasure: z.number().positive(),
          trackId: z.string().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return updateAudioClipPosition(
          { db: ctx.db, audioClipRepo: ctx.audioClip, trackRepo: ctx.track },
          {
            clipId: input.clipId,
            startMeasure: input.startMeasure,
            trackId: input.trackId,
          },
        );
      }),

    delete: authedProcedure
      .input(z.object({ clipId: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        return deleteAudioClip(
          { db: ctx.db, audioClipRepo: ctx.audioClip, fileStorage: ctx.fileStorage },
          { clipId: input.clipId },
        );
      }),

    getDownloadUrls: authedProcedure
      .input(z.object({ storageKeys: z.array(z.string()) }))
      .query(async ({ input, ctx }) => {
        return getSignedUrls({ fileStorage: ctx.fileStorage }, {
          storageKeys: input.storageKeys,
        });
      }),

    rename: authedProcedure
      .input(z.object({ clipId: z.string().min(1), name: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        return renameAudioClip({ db: ctx.db, audioClipRepo: ctx.audioClip }, input);
      }),

    deleteMany: authedProcedure
      .input(z.object({ clipIds: z.array(z.string().min(1)).min(1) }))
      .mutation(async ({ input, ctx }) => {
        return deleteManyAudioClips(
          { db: ctx.db, audioClipRepo: ctx.audioClip, fileStorage: ctx.fileStorage },
          { clipIds: input.clipIds },
        );
      }),
  });
