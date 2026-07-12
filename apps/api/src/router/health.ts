import { router, publicProcedure } from "../trpc";
import { healthCheck } from "@echo/modules/health/app";

export const makeHealthRouter = () =>
  router({
    health: publicProcedure.query(({ ctx }) =>
      healthCheck({ db: ctx.db, healthCheck: ctx.health }),
    ),
  });
