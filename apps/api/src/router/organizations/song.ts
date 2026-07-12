import { z } from "zod";
import { router, authedProcedure } from "../../trpc";
import { listSongs, createSong, getSong, updateSong } from "@echo/modules/song/app";
import { appErrorToTRPC } from "../../lib/errors";
import { makeSongSectionRouter } from "./song-section";

export const makeSongRouter = () =>
  router({
    section: makeSongSectionRouter(),
    list: authedProcedure
      .input(z.object({ organizationSlug: z.string().min(1) }))
      .query(async ({ input, ctx }) => {
        try {
          return await listSongs(
            { db: ctx.db, songRepo: ctx.song, organizationRepo: ctx.organization },
            { organizationSlug: input.organizationSlug },
          );
        } catch (e) {
          throw appErrorToTRPC(e);
        }
      }),

    create: authedProcedure
      .input(
        z.object({
          organizationSlug: z.string().min(1),
          name: z.string().min(1, "Name is required"),
          key: z.string().nullable().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        try {
          return await createSong(
            { db: ctx.db, songRepo: ctx.song, organizationRepo: ctx.organization },
            {
              organizationSlug: input.organizationSlug,
              name: input.name,
              createdBy: ctx.session.user.id,
              key: input.key,
            },
          );
        } catch (e) {
          throw appErrorToTRPC(e);
        }
      }),

    get: authedProcedure
      .input(z.object({ songId: z.string().min(1) }))
      .query(async ({ input, ctx }) => {
        try {
          return await getSong({ db: ctx.db, songRepo: ctx.song }, { songId: input.songId });
        } catch (e) {
          throw appErrorToTRPC(e);
        }
      }),

    update: authedProcedure
      .input(
        z.object({
          songId: z.string().min(1),
          bpm: z.number().int().positive().optional(),
          key: z.string().nullable().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        try {
          return await updateSong({ db: ctx.db, songRepo: ctx.song }, input);
        } catch (e) {
          throw appErrorToTRPC(e);
        }
      }),
  });
