import { router, publicProcedure } from "../trpc";
import { makeHealthCheck } from "@echo/app";

export const makeHealthRouter = () =>
  router({
    health: publicProcedure.query(({ ctx }) =>
      makeHealthCheck({ healthCheck: ctx.health })(),
    ),
  });
