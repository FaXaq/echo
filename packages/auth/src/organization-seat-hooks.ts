import { APIError } from "better-auth/api";
import type { ServerAuthConfig } from "./server";

const seatsExhaustedError = () =>
  new APIError("FORBIDDEN", {
    message: "This organization has no seats left on its current plan.",
  });

export const makeOrganizationSeatHooks = (
  hasSeatAvailable: ServerAuthConfig["hasSeatAvailable"],
) => ({
  beforeCreateInvitation: async ({ organization }: { organization: { id: string } }) => {
    const available = await hasSeatAvailable?.(organization.id);
    if (available === false) throw seatsExhaustedError();
  },
  beforeAcceptInvitation: async ({
    organization,
    invitation,
  }: {
    organization: { id: string };
    invitation: { id: string };
  }) => {
    const available = await hasSeatAvailable?.(organization.id, invitation.id);
    if (available === false) throw seatsExhaustedError();
  },
});
