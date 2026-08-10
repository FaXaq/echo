import type { CreateOrganizationCommandPortFactory } from "./create-organization.command.port";

function isSlugTakenError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "body" in error &&
    (error as { body?: { code?: string } }).body?.code === "ORGANIZATION_ALREADY_EXISTS"
  );
}

export const createOrganizationCommandFactory: CreateOrganizationCommandPortFactory =
  (deps) => async (input) => {
    try {
      const organization = await deps.auth.api.createOrganization({
        ...(deps.headers ? { headers: deps.headers } : {}),
        body: {
          name: input.name,
          slug: input.slug,
          userId: input.userId,
        },
      });

      return {
        status: "created",
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          isPersonal: organization.isPersonal ?? false,
        },
      };
    } catch (error) {
      if (isSlugTakenError(error)) return { status: "slug_taken" };
      throw error;
    }
  };
