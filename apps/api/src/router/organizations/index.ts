import { authedProcedure, router } from "../../trpc";
import { listUserOrganizationsQueryFactory } from "@echo/modules/organization/infrastructure";
import { selfListOrganizations } from "@echo/modules/organization/app";

export const makeOrganizationRouter = () =>
  router({
    selfList: authedProcedure
      .query(({ ctx }) => {
        const listUserOrganizationsQuery = listUserOrganizationsQueryFactory({ headers: ctx.headers, auth: ctx.auth });
        return selfListOrganizations({ listUserOrganizationsQuery });
      }),
  });
