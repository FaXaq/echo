import { getOrganizationStorageQuota } from "@echo/modules/plan/app";
import { organizationProcedure, router } from "../../trpc";

export const makeQuotaRouter = () =>
  router({
    storage: organizationProcedure.query(async ({ ctx }) => {
      return getOrganizationStorageQuota(
        { db: ctx.db, userHasPermissionInOrganization: ctx.userHasPermissionInOrganization },
        { scope: ctx.organizationScope },
      );
    }),
  });
