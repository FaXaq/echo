import { makeServerAuth } from "@echo/auth";
import { makeServerI18n, toLocale, emailMessages } from "@echo/i18n";
import { makeDbAdapter } from "../db/index";
import { appConfig } from "../config/index";
import {
  renderResetPasswordEmail,
  renderInvitationEmail,
} from "@echo/modules/notification/infrastructure";
import { makeMailer } from "@echo/adapters/mailer";

const { pool } = makeDbAdapter(appConfig.db);
const mailer = makeMailer(appConfig.mailer);

const auth = makeServerAuth({
  secret: appConfig.auth.secret,
  pool,
  baseUrl: appConfig.auth.baseUrl,
  trustedOrigins: appConfig.auth.trustedOrigins,
  getInitialOrganizationId: async () => {
    return undefined;
  },
  sendResetPasswordEmail: async ({ email, locale }, token) => {
    const i18n = makeServerI18n(toLocale(locale));
    await mailer.send({
      to: email,
      subject: i18n._(emailMessages.resetPasswordSubject),
      html: await renderResetPasswordEmail(
        {
          email,
          token,
          appBaseUrl: appConfig.appBaseUrl,
        },
        i18n,
      ),
    });
  },
  sendOrganizationInvitation: async ({ invitation, organization, inviter }) => {
    const i18n = makeServerI18n(toLocale((inviter as { locale?: string }).locale));
    await mailer.send({
      to: invitation.email,
      subject: i18n._({
        ...emailMessages.invitationSubject,
        values: { orgName: organization.name },
      }),
      html: await renderInvitationEmail(
        {
          orgName: organization.name,
          invitationId: invitation.id,
          appBaseUrl: appConfig.appBaseUrl,
        },
        i18n,
      ),
    });
  },
});

export default auth;
