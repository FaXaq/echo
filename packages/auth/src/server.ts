import { betterAuth } from "better-auth";
import type { OrganizationOptions } from "better-auth/plugins";
import { admin as adminPlugin, organization, username } from "better-auth/plugins";
import type { Pool } from "pg";
import { ac as adminAc, roles as adminRoles } from "./plugins/admin/permissions";
import {
  ac as organizationsAc,
  roles as organizationsRoles,
} from "./plugins/organization/permissions";
import { organizationAdditionalFields, userAdditionalFields } from "./additional-fields";

export type ServerAuthConfig = {
  secret: string;
  pool: Pool;
  baseUrl: string;
  trustedOrigins?: string[];
  sendOrganizationInvitation?: OrganizationOptions["sendInvitationEmail"];
  getInitialOrganizationId?: (userId: string) => Promise<string | undefined>;
  sendResetPasswordEmail?: (
    user: { email: string; locale: string },
    token: string,
  ) => Promise<void>;
};

export const makeServerAuth = (config: ServerAuthConfig) => {
  return betterAuth({
    user: {
      additionalFields: userAdditionalFields,
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            try {
              const organizationId =
                (await config.getInitialOrganizationId?.(session.userId)) ?? undefined;

              return {
                data: {
                  ...session,
                  activeOrganizationId: organizationId,
                },
              };
            } catch {
              return { data: session };
            }
          },
        },
      },
    },
    secret: config.secret,
    emailAndPassword: {
      enabled: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, token }) => {
        return await config.sendResetPasswordEmail?.(
          {
            email: user.email,
            locale: (user as { locale?: string }).locale ?? "en",
          },
          token,
        );
      },
    },
    advanced: {
      ipAddress: {
        disableIpTracking: false,
      },
    },
    database: config.pool,
    baseURL: config.baseUrl,
    trustedOrigins: config.trustedOrigins,
    plugins: [
      adminPlugin({
        ac: adminAc,
        roles: adminRoles,
        defaultRole: "client",
      }),
      organization({
        ac: organizationsAc,
        roles: organizationsRoles,
        schema: {
          organization: {
            additionalFields: organizationAdditionalFields,
          },
        },
        sendInvitationEmail: config.sendOrganizationInvitation,
      }),
      username(),
    ],
  });
};

export type ServerAuth = ReturnType<typeof makeServerAuth>;
export type ServerSession = ReturnType<typeof makeServerAuth>["$Infer"]["Session"];
export type ServerOrganization = ReturnType<typeof makeServerAuth>["$Infer"]["Organization"];
export type ServerOrganizationMember = ReturnType<typeof makeServerAuth>["$Infer"]["Member"];
export type ServerOrganizationInvitation = ReturnType<
  typeof makeServerAuth
>["$Infer"]["Invitation"];
