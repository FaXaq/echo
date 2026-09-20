import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Contact } from "../domain/index.js";
import type { InsertContactCommandPort } from "../infrastructure/insert-contact.command.port.js";

export async function createContact(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    insertContactCommand: InsertContactCommandPort;
  },
  input: {
    scope: OrganizationScope;
    name: string;
    phone: string | null;
    email: string | null;
    description: string | null;
  },
): Promise<Contact> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { contact: ["create"] },
  });
  if (!success) throw forbidden({ entity: "Contact", action: "create" });

  return deps.insertContactCommand(deps.db, input.scope, {
    id: crypto.randomUUID(),
    name: input.name,
    phone: input.phone,
    email: input.email,
    description: input.description,
  });
}
