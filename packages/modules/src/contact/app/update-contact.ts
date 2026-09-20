import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Contact } from "../domain/index.js";
import type { UpdateContactCommandPort } from "../infrastructure/update-contact.command.port.js";

export async function updateContact(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    updateContactCommand: UpdateContactCommandPort;
  },
  input: {
    scope: OrganizationScope;
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    description: string | null;
  },
): Promise<Contact> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { contact: ["update"] },
  });
  if (!success) throw forbidden({ entity: "Contact", action: "update" });

  const contact = await deps.updateContactCommand(deps.db, input.scope, {
    id: input.id,
    name: input.name,
    phone: input.phone,
    email: input.email,
    description: input.description,
  });
  if (!contact) throw notFound("Contact");
  return contact;
}
