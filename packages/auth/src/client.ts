import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  inferAdditionalFields,
  inferOrgAdditionalFields,
  organizationClient,
  usernameClient,
  type InferMember,
  type InferInvitation,
} from "better-auth/client/plugins";
import { adminPluginConfig } from "./plugins/admin/permissions";
import { organizationPluginConfig } from "./plugins/organization/permissions";
import type { makeServerAuth } from "./server";

export type ClientAuthConfig = { baseURL?: string };

export const makeClientAuth = (config?: ClientAuthConfig) =>
  createAuthClient({
    baseURL: config?.baseURL,
    plugins: [
      inferAdditionalFields<ReturnType<typeof makeServerAuth>>(),
      adminClient({
        ...adminPluginConfig,
        schema: inferAdditionalFields<ReturnType<typeof makeServerAuth>>(),
      }),
      organizationClient({
        ...organizationPluginConfig,
        schema: inferOrgAdditionalFields<ReturnType<typeof makeServerAuth>>(),
      }),
      usernameClient(),
    ],
  });

export type AuthClient = ReturnType<typeof makeClientAuth>;
export type ClientSession = ReturnType<typeof makeClientAuth>["$Infer"]["Session"];
export type ClientOrganization = ReturnType<typeof makeClientAuth>["$Infer"]["Organization"];
export type ClientMember = InferMember<typeof organizationPluginConfig>;
export type ClientInvitation = InferInvitation<typeof organizationPluginConfig>;
