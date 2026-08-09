import { makeServerAuth } from "@echo/auth";
import {
  createOrganizationCommandFactory,
  markOrganizationPersonal,
} from "@echo/modules/organization/infrastructure";
import { createOrganization } from "@echo/modules/organization/app";
import { db, pool } from "./db";
import { cliConfig } from "../config/index";

export const auth: ReturnType<typeof makeServerAuth> = makeServerAuth({
  secret: cliConfig.auth.secret,
  pool,
  baseUrl: cliConfig.auth.baseUrl,
  onUserCreated: async (user) => {
    try {
      const createOrganizationCommand = createOrganizationCommandFactory({ auth });
      const organization = await createOrganization(
        { createOrganizationCommand },
        { name: `${user.name}'s organization`, userId: user.id },
      );
      await markOrganizationPersonal(db, organization.id, user.id);
    } catch (error) {
      console.error("Failed to create personal organization for user", user.id, error);
    }
  },
});
