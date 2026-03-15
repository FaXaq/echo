import { makeServerI18n } from "@echo/i18n";
import type { EmailNotifierPort, MailerPort } from "@echo/app";
import {
  renderInvitationEmail,
  renderResetPasswordEmail,
} from "./mailer/templates/index";

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
        html: renderResetPasswordEmail(
          {
            email: to,
            token,
            appBaseUrl: appBaseUrl,
          },
          t,
        ),
      }),
  };
};
