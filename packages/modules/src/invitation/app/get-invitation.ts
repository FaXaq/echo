import type { KyselyDB } from "@echo/db";
import { getInvitationById } from "../infrastructure/index.js";

export function getInvitation(deps: { db: KyselyDB }, input: { id: string }) {
  return getInvitationById(deps.db, input.id);
}
