import { z } from "zod";
import { searchPlaces } from "@echo/modules/place/app";
import { authedProcedure, router } from "../trpc";

export const makePlaceRouter = () =>
  router({
    searchPlaces: authedProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(({ ctx, input }) => searchPlaces({ geocoding: ctx.geocoding }, input)),
  });
