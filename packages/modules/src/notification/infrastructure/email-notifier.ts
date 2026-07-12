import { makeServerI18n } from "@echo/i18n";
import type { MailerPort } from "./mailer.port.js";
import type { EmailNotifierPort } from "./email-notifier.port.js";
import { renderInvitationEmail, renderResetPasswordEmail } from "./templates/index.js";

export const makeEmailNotifierRepo = ({
  mailer,
  appBaseUrl,
}: {
  mailer: MailerPort;
  appBaseUrl: string;
}): EmailNotifierPort => {
  const t = makeServerI18n();

  return {
    sendUserInvitationToJoinOrganization: ({ to, orgName, invitationId }) =>
      mailer.send({
        to,
        subject: t("emails", "Invitation to join {{orgName}}", { orgName }),
        html: renderInvitationEmail({ orgName, invitationId, appBaseUrl }, t),
      }),

    sendUserResetPassword: ({ to, token }) =>
      mailer.send({
        to: to,
        subject: t("emails", "Reset your Echo password"),
        html: renderResetPasswordEmail({ email: to, appBaseUrl, token }, t),
      }),
  };
};
