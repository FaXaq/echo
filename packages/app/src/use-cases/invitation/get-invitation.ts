import type { InvitationRepoPort } from "../../ports/invitation";

export const makeGetInvitation =
  (deps: { invitationRepo: InvitationRepoPort }) =>
  (input: { id: string }) =>
    deps.invitationRepo.getById(input.id);

export type GetInvitation = ReturnType<typeof makeGetInvitation>;
