import { router, publicProcedure } from "../trpc";

export const makeDebugRouter = () =>
  router({
    version: publicProcedure.query(() => ({
      release: process.env.APP_VERSION ?? "unknown",
      environment: process.env.NODE_ENV ?? "unknown",
    })),
  });
