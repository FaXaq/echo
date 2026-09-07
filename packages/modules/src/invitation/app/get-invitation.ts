import type { KyselyDB } from "@echo/db";
import type { GetInvitationByIdQueryPort } from "../infrastructure/index.js";

export function getInvitation(
  deps: { db: KyselyDB; getInvitationByIdQuery: GetInvitationByIdQueryPort },
  input: { id: string },
) {
  return deps.getInvitationByIdQuery(deps.db, input);
}
