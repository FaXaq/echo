import { z } from "zod";
import { router, authedProcedure } from "../../trpc";
import {
  makeRegisterMidiClip,
  makeListMidiClipsBySong,
  makeUpdateMidiClipPosition,
  makeRenameMidiClip,
  makeDeleteMidiClip,
  makeDeleteManyMidiClips,
} from "@echo/modules/midi-clip/use-cases";
import { makeGetSignedUrls } from "@echo/modules/audio-clip/use-cases";

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
          trackId: z.string().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return makeUpdateMidiClipPosition({
          midiClipRepo: ctx.midiClip,
          trackRepo: ctx.track,
        })({
          clipId: input.clipId,
          startMeasure: input.startMeasure,
          trackId: input.trackId,
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

    deleteMany: authedProcedure
      .input(z.object({ clipIds: z.array(z.string().min(1)).min(1) }))
      .mutation(async ({ input, ctx }) => {
        return makeDeleteManyMidiClips({ midiClipRepo: ctx.midiClip })({
          clipIds: input.clipIds,
        });
      }),
  });
