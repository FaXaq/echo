import { z } from "zod";
import { router, authedProcedure } from "../../trpc";
import { makeListSongs, makeCreateSong, makeGetSong, makeUpdateSong } from "@echo/modules/song/use-cases";
import { appErrorToTRPC } from "../../lib/errors";

export const makeSongRouter = () =>
  router({
    list: authedProcedure
      .input(z.object({ organizationSlug: z.string().min(1) }))
      .query(async ({ input, ctx }) => {
        try {
          return await makeListSongs({
            songRepo: ctx.song,
            organizationRepo: ctx.organization,
          })({ organizationSlug: input.organizationSlug });
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
          return await makeCreateSong({
            songRepo: ctx.song,
            organizationRepo: ctx.organization,
          })({
            organizationSlug: input.organizationSlug,
            name: input.name,
            createdBy: ctx.session.user.id,
            key: input.key,
          });
        } catch (e) {
          throw appErrorToTRPC(e);
        }
      }),

    get: authedProcedure
      .input(z.object({ songId: z.string().min(1) }))
      .query(async ({ input, ctx }) => {
        try {
          return await makeGetSong({ songRepo: ctx.song })({
            songId: input.songId,
          });
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
          return await makeUpdateSong({ songRepo: ctx.song })(input);
        } catch (e) {
          throw appErrorToTRPC(e);
        }
      }),
  });
