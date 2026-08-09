import type { ServerAuth } from "@echo/auth";
import type { Organization } from "../domain";

export type CreateOrganizationInput = {
  name: string;
  slug: string;
  userId: string;
  isPersonal?: boolean;
};

export type CreateOrganizationResult =
  | { status: "created"; organization: Organization }
  | { status: "slug_taken" };

export type CreateOrganizationCommandPort = (
  input: CreateOrganizationInput,
) => Promise<CreateOrganizationResult>;

export type CreateOrganizationCommandPortFactory = (deps: {
  auth: ServerAuth;
  headers?: Headers;
}) => CreateOrganizationCommandPort;
