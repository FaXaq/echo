import nodemailer from "nodemailer";
import { makeServerI18n } from "@echo/i18n";
import {
  renderInvitationEmail,
  renderResetPasswordEmail,
} from "./templates/index.js";

export { renderInvitationEmail, renderResetPasswordEmail } from "./templates/index.js";

// --- Mailer ---

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export interface MailerPort {
  send: (options: SendMailOptions) => Promise<void>;
}

export type MailerConfig = { host: string; port: number; from: string };

export const makeMailer = (config: MailerConfig): MailerPort => {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
  });
  return {
    send: async (options: SendMailOptions) => {
      await transport.sendMail({
        from: config.from,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        html: options.html,
      });
    },
  };
};

// --- Email notifier ---

export interface EmailNotifierPort {
  sendUserInvitationToJoinOrganization: (opts: {
    to: string;
    orgName: string;
    invitationId: string;
  }) => Promise<void>;

  sendUserResetPassword: (opts: { to: string; token: string }) => Promise<void>;
}

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
            appBaseUrl,
            token,
          },
          t,
        ),
      }),
  };
};
