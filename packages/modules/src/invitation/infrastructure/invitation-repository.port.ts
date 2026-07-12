import type { KyselyDB } from "@echo/db";
import type { InvitationDetails } from "../domain/index.js";

export type { InvitationDetails };

export interface InvitationRepoPort {
  getById: (db: KyselyDB, id: string) => Promise<InvitationDetails | null>;
}
