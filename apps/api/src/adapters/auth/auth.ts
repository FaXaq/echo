import { makeServerAuth } from "@echo/auth";
import { makeServerI18n, toLocale, emailMessages } from "@echo/i18n";
import { makeDbAdapter } from "../db/index";
import { appConfig } from "../config/index";
import {
  renderResetPasswordEmail,
  renderInvitationEmail,
} from "@echo/modules/notification/infrastructure";
import { deleteOrganizationFiles } from "@echo/modules/file/app";
import {
  createOrganizationCommandFactory,
  getPersonalOrganizationQuery,
  markOrganizationPersonal,
} from "@echo/modules/organization/infrastructure";
import { createOrganization } from "@echo/modules/organization/app";
import { hasSeatAvailable } from "@echo/modules/plan/app";
import { makeMailer } from "@echo/adapters/mailer";
import { makeS3Storage } from "@echo/adapters/s3-storage";
import { makeLogger } from "@echo/logger";

const { db, pool } = makeDbAdapter(appConfig.db);
const mailer = makeMailer(appConfig.mailer);
const s3Storage = makeS3Storage(appConfig.s3);
const logger = makeLogger();

const auth: ReturnType<typeof makeServerAuth> = makeServerAuth({
  secret: appConfig.auth.secret,
  pool,
  baseUrl: appConfig.auth.baseUrl,
  trustedOrigins: appConfig.auth.trustedOrigins,
  getInitialOrganizationId: async (userId) => {
    const organization = await getPersonalOrganizationQuery(db, userId);
    return organization?.id;
  },
  onUserCreated: async (user) => {
    try {
      const createOrganizationCommand = createOrganizationCommandFactory({ auth });
      const organization = await createOrganization(
        { createOrganizationCommand },
        { name: `${user.name}`, userId: user.id },
      );
      await markOrganizationPersonal(db, organization.id, user.id);
    } catch (error) {
      logger.error({ error, userId: user.id }, "Failed to create personal organization on signup");
    }
  },
  onOrganizationDeleted: async (organization) => {
    const failures = await deleteOrganizationFiles(
      { db, s3Storage },
      { organizationId: organization.id },
    );
    for (const failure of failures) {
      logger.error(
        { error: failure.error, fileId: failure.fileId, organizationId: organization.id },
        "Failed to delete S3 object during organization deletion",
      );
    }
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
  hasSeatAvailable: async (organizationId) => hasSeatAvailable({ db }, { organizationId }),
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
