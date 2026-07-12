import type { KyselyDB } from "@echo/db";
import type { InvitationRepoPort } from "../infrastructure/index.js";

export function getInvitation(
  deps: { db: KyselyDB; invitationRepo: InvitationRepoPort },
  input: { id: string },
) {
  return deps.invitationRepo.getById(deps.db, input.id);
}
