import { z } from "zod";
import { router, authedProcedure } from "../../trpc";
import {
  makeRegisterMidiClip,
  makeListMidiClipsBySong,
  makeUpdateMidiClipPosition,
  makeRenameMidiClip,
  makeDeleteMidiClip,
  makeGetSignedUrls,
} from "@echo/app";

export const makeMidiClipRouter = () =>
  router({
    listBySong: authedProcedure
      .input(z.object({ songId: z.string().min(1) }))
      .query(async ({ input, ctx }) => {
        return makeListMidiClipsBySong({ midiClipRepo: ctx.midiClip })({
          songId: input.songId,
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
        return makeRegisterMidiClip({
          midiClipRepo: ctx.midiClip,
          fileRepo: ctx.file,
        })({
          trackId: input.trackId,
          filename: input.filename,
          storageKey: input.storageKey,
          organizationId: input.organizationId,
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
        return makeUpdateMidiClipPosition({ midiClipRepo: ctx.midiClip })({
          clipId: input.clipId,
          startMeasure: input.startMeasure,
        });
      }),

    rename: authedProcedure
      .input(z.object({ clipId: z.string().min(1), name: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        return makeRenameMidiClip({ midiClipRepo: ctx.midiClip })(input);
      }),

    delete: authedProcedure
      .input(z.object({ clipId: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        return makeDeleteMidiClip({ midiClipRepo: ctx.midiClip })(input);
      }),

    getDownloadUrls: authedProcedure
      .input(z.object({ storageKeys: z.array(z.string()) }))
      .query(async ({ input, ctx }) => {
        return makeGetSignedUrls({ fileStorage: ctx.fileStorage })({
          storageKeys: input.storageKeys,
        });
      }),
  });
