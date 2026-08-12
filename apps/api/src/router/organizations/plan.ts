import { z } from "zod";
import { forbidden } from "@echo/errors";
import { getOrganizationPlan } from "@echo/modules/plan/app";
import { authedProcedure, router } from "../../trpc";

export const makePlanRouter = () =>
  router({
    overview: authedProcedure
      .input(z.object({ organizationId: z.string() }))
      .query(async ({ ctx, input }) => {
        const { success } = await ctx.userHasPermissionInOrganization({
          organizationId: input.organizationId,
          permissions: { "*": ["read"] },
        });
        if (!success) throw forbidden({ entity: "Organization", action: "read" });

        return getOrganizationPlan({ db: ctx.db }, input);
      }),
  });
