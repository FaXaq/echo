import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachContact } from "../domain/index.js";
import type { UpdateOutreachContactCommandPort } from "../infrastructure/update-outreach-contact.command.port.js";

export async function updateOutreachContact(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    updateOutreachContactCommand: UpdateOutreachContactCommandPort;
  },
  input: {
    scope: OrganizationScope;
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    description: string | null;
  },
): Promise<OutreachContact> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { contact: ["update"] },
  });
  if (!success) throw forbidden({ entity: "OutreachContact", action: "update" });

  const contact = await deps.updateOutreachContactCommand(deps.db, input.scope, {
    id: input.id,
    name: input.name,
    phone: input.phone,
    email: input.email,
    description: input.description,
  });
  if (!contact) throw notFound("OutreachContact");
  return contact;
}
