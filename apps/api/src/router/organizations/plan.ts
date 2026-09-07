import { getOrganizationPlan } from "@echo/modules/plan/app";
import {
  getOrganizationSeatUsageQueryFactory,
  resolvePlanQueryFactory,
} from "@echo/modules/plan/infrastructure";
import { organizationProcedure, router } from "../../trpc";
import { makeQuotaRouter } from "./quota";

const resolvePlanQuery = resolvePlanQueryFactory();
const getOrganizationSeatUsageQuery = getOrganizationSeatUsageQueryFactory();

export const makePlanRouter = () =>
  router({
    overview: organizationProcedure.query(async ({ ctx }) => {
      return getOrganizationPlan(
        {
          db: ctx.db,
          userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          resolvePlanQuery,
          getOrganizationSeatUsageQuery,
        },
        { scope: ctx.organizationScope },
      );
    }),
    quota: makeQuotaRouter(),
  });
