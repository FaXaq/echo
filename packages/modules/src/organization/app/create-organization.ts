import { conflict } from "@echo/errors";
import { generateOrgSlug, type Organization } from "../domain";
import type { CreateOrganizationCommandPort } from "../infrastructure/create-organization.command.port";

const MAX_SLUG_ATTEMPTS = 5;

export async function createOrganization(
  deps: { createOrganizationCommand: CreateOrganizationCommandPort },
  input: { name: string; userId: string; isPersonal?: boolean },
): Promise<Organization> {
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const result = await deps.createOrganizationCommand({
      name: input.name,
      slug: generateOrgSlug(),
      userId: input.userId,
      isPersonal: input.isPersonal,
    });
    if (result.status === "created") return result.organization;
  }

  throw conflict("Could not generate a unique organization slug");
}
