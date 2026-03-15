import { z } from "zod";
import { router, authedProcedure } from "../../trpc";
import { makeListSongs, makeCreateSong, makeGetSong } from "@echo/app";
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
  });
