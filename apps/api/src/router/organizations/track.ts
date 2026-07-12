import { z } from "zod";
import { router, authedProcedure } from "../../trpc";
import {
  listTracks,
  createTrack,
  updateTrackVolume,
  setTrackInstrumentPreset,
  deleteTrack,
  renameTrack,
  reorderTracks,
} from "@echo/modules/track/app";

export const makeTrackRouter = () =>
  router({
    list: authedProcedure
      .input(z.object({ songId: z.string().min(1) }))
      .query(async ({ input, ctx }) => {
        return listTracks({ db: ctx.db, trackRepo: ctx.track }, { songId: input.songId });
      }),

    create: authedProcedure
      .input(
        z.object({
          songId: z.string().min(1),
          name: z.string().min(1, "Track name is required"),
          volume: z.number().min(-60).max(6).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return createTrack(
          { db: ctx.db, trackRepo: ctx.track },
          { songId: input.songId, name: input.name, volume: input.volume },
        );
      }),

    updateVolume: authedProcedure
      .input(
        z.object({
          trackId: z.string().min(1),
          volumeDb: z.number().min(-60).max(6),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return updateTrackVolume(
          { db: ctx.db, trackRepo: ctx.track },
          { trackId: input.trackId, volumeDb: input.volumeDb },
        );
      }),

    setInstrumentPreset: authedProcedure
      .input(
        z.object({
          trackId: z.string().min(1),
          preset: z.number().int().min(0).max(127).nullable(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return setTrackInstrumentPreset({ db: ctx.db, trackRepo: ctx.track }, input);
      }),

    delete: authedProcedure
      .input(z.object({ trackId: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        return deleteTrack({ db: ctx.db, trackRepo: ctx.track }, { trackId: input.trackId });
      }),

    rename: authedProcedure
      .input(
        z.object({
          trackId: z.string().min(1),
          name: z.string().min(1, "Track name is required"),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return renameTrack({ db: ctx.db, trackRepo: ctx.track }, input);
      }),

    reorder: authedProcedure
      .input(
        z.object({
          songId: z.string().min(1),
          orderedTrackIds: z.array(z.string().min(1)),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return reorderTracks(
          { db: ctx.db, trackRepo: ctx.track },
          { songId: input.songId, orderedTrackIds: input.orderedTrackIds },
        );
      }),
  });
