import { z } from "zod";
import { authedProcedure, router } from "../../trpc";
import {
  listUserOrganizationsQueryFactory,
  createOrganizationCommandFactory,
} from "@echo/modules/organization/infrastructure";
import { selfListOrganizations, createOrganization } from "@echo/modules/organization/app";

export const makeOrganizationRouter = () =>
  router({
    selfList: authedProcedure.query(({ ctx }) => {
      const listUserOrganizationsQuery = listUserOrganizationsQueryFactory({
        headers: ctx.headers,
        auth: ctx.auth,
      });
      return selfListOrganizations({ listUserOrganizationsQuery });
    }),
    create: authedProcedure
      .input(z.object({ name: z.string().min(1) }))
      .mutation(({ ctx, input }) => {
        const createOrganizationCommand = createOrganizationCommandFactory({
          headers: ctx.headers,
          auth: ctx.auth,
        });
        return createOrganization(
          { createOrganizationCommand },
          { name: input.name, userId: ctx.session.user.id },
        );
      }),
  });
