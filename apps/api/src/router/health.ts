import { router, publicProcedure } from "../trpc";
import { makeHealthCheck } from "@echo/modules/health/use-cases";

export const makeHealthRouter = () =>
  router({
    health: publicProcedure.query(({ ctx }) =>
      makeHealthCheck({ healthCheck: ctx.health })(),
    ),
  });
