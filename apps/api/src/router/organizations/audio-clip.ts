import { z } from "zod";
import { router, authedProcedure } from "../../trpc";
import {
  makeListAudioClips,
  makeGetUploadUrl,
  makeRegisterAudioClip,
  makeUpdateAudioClipPosition,
  makeDeleteAudioClip,
  makeGetSignedUrls,
} from "@echo/app";

export const makeAudioClipRouter = () =>
  router({
    listBySong: authedProcedure
      .input(z.object({ songId: z.string().min(1) }))
      .query(async ({ input, ctx }) => {
        return makeListAudioClips({ audioClipRepo: ctx.audioClip })({
          songId: input.songId,
        });
      }),

    getUploadUrl: authedProcedure
      .input(
        z.object({
          filename: z.string().min(1),
          contentType: z.string().min(1),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return makeGetUploadUrl({ fileStorage: ctx.fileStorage })({
          filename: input.filename,
          contentType: input.contentType,
        });
      }),

    register: authedProcedure
      .input(
        z.object({
          trackId: z.string().min(1),
          filename: z.string().min(1),
          storageKey: z.string().min(1),
          startMeasure: z.number().positive(),
          durationMs: z.number().int().positive().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return makeRegisterAudioClip({ audioClipRepo: ctx.audioClip })({
          trackId: input.trackId,
          filename: input.filename,
          storageKey: input.storageKey,
          startMeasure: input.startMeasure,
          durationMs: input.durationMs,
        });
      }),

    updatePosition: authedProcedure
      .input(
        z.object({
          clipId: z.string().min(1),
          startMeasure: z.number().positive(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return makeUpdateAudioClipPosition({ audioClipRepo: ctx.audioClip })({
          clipId: input.clipId,
          startMeasure: input.startMeasure,
        });
      }),

    delete: authedProcedure
      .input(
        z.object({
          clipId: z.string().min(1),
          storageKey: z.string().min(1),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return makeDeleteAudioClip({
          audioClipRepo: ctx.audioClip,
          fileStorage: ctx.fileStorage,
        })({
          clipId: input.clipId,
          storageKey: input.storageKey,
        });
      }),

    getDownloadUrls: authedProcedure
      .input(z.object({ storageKeys: z.array(z.string()) }))
      .query(async ({ input, ctx }) => {
        return makeGetSignedUrls({ fileStorage: ctx.fileStorage })({
          storageKeys: input.storageKeys,
        });
      }),
  });
