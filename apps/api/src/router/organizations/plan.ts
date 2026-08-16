import { z } from "zod";
import { getOrganizationPlan } from "@echo/modules/plan/app";
import { authedProcedure, router } from "../../trpc";

export const makePlanRouter = () =>
  router({
    overview: authedProcedure
      .input(z.object({ organizationId: z.string() }))
      .query(async ({ ctx, input }) => {
        return getOrganizationPlan(
          { db: ctx.db, userHasPermissionInOrganization: ctx.userHasPermissionInOrganization },
          input,
        );
      }),
  });
