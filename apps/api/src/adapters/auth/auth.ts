import { makeServerAuth } from "@echo/auth";
import { makeServerI18n } from "@echo/i18n";
import { makeDbAdapter } from "../db/index";
import { appConfig } from "../config/index";
import { makeMailer, renderResetPasswordEmail, renderInvitationEmail } from "@echo/modules/notification/infrastructure";

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
    const t = makeServerI18n(locale);
    await mailer.send({
      to: email,
      subject: t("emails", "Reset your Echo password"),
      html: await renderResetPasswordEmail(
        {
          email,
          token,
          appBaseUrl: appConfig.appBaseUrl,
        },
        t,
      ),
    });
  },
  sendOrganizationInvitation: async ({ invitation, organization, inviter }) => {
    const inviterLocale = (inviter as { locale?: string }).locale ?? "en";
    const t = makeServerI18n(inviterLocale);
    await mailer.send({
      to: invitation.email,
      subject: t("emails", "Invitation to join {{orgName}}", {
        orgName: organization.name,
      }),
      html: await renderInvitationEmail(
        {
          orgName: organization.name,
          invitationId: invitation.id,
          appBaseUrl: appConfig.appBaseUrl,
        },
        t,
      ),
    });
  },
});

export default auth;
