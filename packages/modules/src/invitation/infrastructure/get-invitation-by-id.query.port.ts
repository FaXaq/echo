import type { KyselyDB } from "@echo/db";
import type { InvitationDetails } from "../domain/index.js";

export type GetInvitationByIdInput = { id: string };

export type GetInvitationByIdQueryPort = (
  db: KyselyDB,
  input: GetInvitationByIdInput,
) => Promise<InvitationDetails | null>;

export type GetInvitationByIdQueryPortFactory = () => GetInvitationByIdQueryPort;
