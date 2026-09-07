import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { getInvitation } from "@echo/modules/invitation/app";
import { getInvitationByIdQueryFactory } from "@echo/modules/invitation/infrastructure";

const getInvitationByIdQuery = getInvitationByIdQueryFactory();

export const makeInvitationRouter = () =>
  router({
    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input, ctx }) =>
        getInvitation({ db: ctx.db, getInvitationByIdQuery }, { id: input.id }),
      ),
  });
