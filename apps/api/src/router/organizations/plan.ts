import { getOrganizationPlan } from "@echo/modules/plan/app";
import { organizationProcedure, router } from "../../trpc";
import { makeQuotaRouter } from "./quota";

export const makePlanRouter = () =>
  router({
    overview: organizationProcedure.query(async ({ ctx }) => {
      return getOrganizationPlan(
        { db: ctx.db, userHasPermissionInOrganization: ctx.userHasPermissionInOrganization },
        { scope: ctx.organizationScope },
      );
    }),
    quota: makeQuotaRouter(),
  });
