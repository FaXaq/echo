import { z } from "zod";
import { router, authedProcedure } from "../../trpc";
import {
  registerMidiClip,
  listMidiClipsBySong,
  updateMidiClipPosition,
  renameMidiClip,
  deleteMidiClip,
  deleteManyMidiClips,
} from "@echo/modules/midi-clip/app";
import { getSignedUrls } from "@echo/modules/audio-clip/app";

export const makeMidiClipRouter = () =>
  router({
    listBySong: authedProcedure
      .input(z.object({ songId: z.string().min(1) }))
      .query(async ({ input, ctx }) => {
        return listMidiClipsBySong({ db: ctx.db, midiClipRepo: ctx.midiClip }, {
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
        return registerMidiClip(
          { db: ctx.db, midiClipRepo: ctx.midiClip, fileRepo: ctx.file },
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
        return updateMidiClipPosition(
          { db: ctx.db, midiClipRepo: ctx.midiClip, trackRepo: ctx.track },
          {
            clipId: input.clipId,
            startMeasure: input.startMeasure,
            trackId: input.trackId,
          },
        );
      }),

    rename: authedProcedure
      .input(z.object({ clipId: z.string().min(1), name: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        return renameMidiClip({ db: ctx.db, midiClipRepo: ctx.midiClip }, input);
      }),

    delete: authedProcedure
      .input(z.object({ clipId: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        return deleteMidiClip({ db: ctx.db, midiClipRepo: ctx.midiClip }, input);
      }),

    getDownloadUrls: authedProcedure
      .input(z.object({ storageKeys: z.array(z.string()) }))
      .query(async ({ input, ctx }) => {
        return getSignedUrls({ fileStorage: ctx.fileStorage }, {
          storageKeys: input.storageKeys,
        });
      }),

    deleteMany: authedProcedure
      .input(z.object({ clipIds: z.array(z.string().min(1)).min(1) }))
      .mutation(async ({ input, ctx }) => {
        return deleteManyMidiClips({ db: ctx.db, midiClipRepo: ctx.midiClip }, {
          clipIds: input.clipIds,
        });
      }),
  });
