import { makeServerI18n } from "@echo/i18n";
import type { MailerPort } from "@echo/adapters/mailer";
import { renderInvitationEmail } from "./templates/index.js";

export async function sendUserInvitationToJoinOrganization(
  deps: { mailer: MailerPort; appBaseUrl: string },
  input: { to: string; orgName: string; invitationId: string },
): Promise<void> {
  const t = makeServerI18n();
  await deps.mailer.send({
    to: input.to,
    subject: t("emails", "Invitation to join {{orgName}}", { orgName: input.orgName }),
    html: await renderInvitationEmail(
      { orgName: input.orgName, invitationId: input.invitationId, appBaseUrl: deps.appBaseUrl },
      t,
    ),
  });
}
