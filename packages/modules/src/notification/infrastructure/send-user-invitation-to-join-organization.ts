import { makeServerI18n, emailMessages } from "@echo/i18n";
import type { MailerPort } from "@echo/adapters/mailer";
import { renderInvitationEmail } from "./templates/index.js";

export async function sendUserInvitationToJoinOrganization(
  deps: { mailer: MailerPort; appBaseUrl: string },
  input: { to: string; orgName: string; invitationId: string },
): Promise<void> {
  const i18n = makeServerI18n();
  await deps.mailer.send({
    to: input.to,
    subject: i18n._({ ...emailMessages.invitationSubject, values: { orgName: input.orgName } }),
    html: await renderInvitationEmail(
      { orgName: input.orgName, invitationId: input.invitationId, appBaseUrl: deps.appBaseUrl },
      i18n,
    ),
  });
}
