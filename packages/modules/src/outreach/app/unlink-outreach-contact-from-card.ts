import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { UnlinkOutreachContactFromCardCommandPort } from "../infrastructure/unlink-outreach-contact-from-card.command.port.js";

export async function unlinkOutreachContactFromCard(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    unlinkOutreachContactFromCardCommand: UnlinkOutreachContactFromCardCommandPort;
  },
  input: { scope: OrganizationScope; cardId: string; contactId: string },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { outreach: ["update"] },
  });
  if (!success) throw forbidden({ entity: "OutreachCard", action: "update" });

  await deps.unlinkOutreachContactFromCardCommand(deps.db, input.scope, {
    cardId: input.cardId,
    contactId: input.contactId,
  });
}
