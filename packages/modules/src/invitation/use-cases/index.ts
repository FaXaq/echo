import type { InvitationRepoPort } from "../infrastructure/index.js";

export const makeGetInvitation =
  (deps: { invitationRepo: InvitationRepoPort }) =>
  (input: { id: string }) =>
    deps.invitationRepo.getById(input.id);

export type GetInvitation = ReturnType<typeof makeGetInvitation>;
