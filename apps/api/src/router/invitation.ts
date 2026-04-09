import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { makeGetInvitation } from "@echo/modules/invitation/use-cases";

export const makeInvitationRouter = () =>
  router({
    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input, ctx }) =>
        makeGetInvitation({ invitationRepo: ctx.invitation })({ id: input.id }),
      ),
  });
