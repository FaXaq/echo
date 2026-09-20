import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachContact } from "../domain/index.js";
import type { InsertOutreachContactCommandPort } from "../infrastructure/insert-outreach-contact.command.port.js";

export async function createOutreachContact(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    insertOutreachContactCommand: InsertOutreachContactCommandPort;
  },
  input: {
    scope: OrganizationScope;
    name: string;
    phone: string | null;
    email: string | null;
    description: string | null;
  },
): Promise<OutreachContact> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { contact: ["create"] },
  });
  if (!success) throw forbidden({ entity: "OutreachContact", action: "create" });

  return deps.insertOutreachContactCommand(deps.db, input.scope, {
    id: crypto.randomUUID(),
    name: input.name,
    phone: input.phone,
    email: input.email,
    description: input.description,
  });
}
