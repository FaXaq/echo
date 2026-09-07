import { getOrganizationStorageQuota } from "@echo/modules/plan/app";
import {
  getOrganizationStorageUsageQueryFactory,
  resolvePlanQueryFactory,
} from "@echo/modules/plan/infrastructure";
import { organizationProcedure, router } from "../../trpc";

const resolvePlanQuery = resolvePlanQueryFactory();
const getOrganizationStorageUsageQuery = getOrganizationStorageUsageQueryFactory();

export const makeQuotaRouter = () =>
  router({
    storage: organizationProcedure.query(async ({ ctx }) => {
      return getOrganizationStorageQuota(
        {
          db: ctx.db,
          userHasPermissionInOrganization: ctx.userHasPermissionInOrganization,
          resolvePlanQuery,
          getOrganizationStorageUsageQuery,
        },
        { scope: ctx.organizationScope },
      );
    }),
  });
