import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { getInvitation } from "@echo/modules/invitation/app";

export const makeInvitationRouter = () =>
  router({
    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input, ctx }) => getInvitation({ db: ctx.db }, { id: input.id })),
  });
