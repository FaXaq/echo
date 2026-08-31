import mjml2html from "mjml";
import type { makeServerI18n } from "@echo/i18n";
import { emailMessages } from "@echo/i18n";

type I18n = ReturnType<typeof makeServerI18n>;

export async function renderInvitationEmail(
  data: {
    orgName: string;
    invitationId: string;
    appBaseUrl: string;
  },
  i18n: I18n,
): Promise<string> {
  const bodyText = i18n._({ ...emailMessages.invitationBody, values: { orgName: data.orgName } });
  const buttonText = i18n._(emailMessages.invitationButton);

  const { html, errors } = await mjml2html(`
    <mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text>${bodyText}</mj-text>
            <mj-button href="${data.appBaseUrl}/accept-invitation?id=${data.invitationId}">
              ${buttonText}
            </mj-button>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `);
  if (errors.length)
    throw new Error(errors.map((e: { formattedMessage: string }) => e.formattedMessage).join("\n"));
  return html;
}

export async function renderResetPasswordEmail(
  data: {
    email: string;
    appBaseUrl: string;
    token: string;
  },
  i18n: I18n,
): Promise<string> {
  const bodyText = i18n._(emailMessages.resetPasswordBody);
  const buttonText = i18n._(emailMessages.resetPasswordButton);

  const { html, errors } = await mjml2html(`
    <mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text>${bodyText}</mj-text>
            <mj-button href="${data.appBaseUrl}/reset-password?token=${data.token}">
              ${buttonText}
            </mj-button>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `);
  if (errors.length) throw new Error(errors.map((e) => e.formattedMessage).join("\n"));
  return html;
}

export async function renderVerifyEmail(
  data: {
    appBaseUrl: string;
    token: string;
  },
  i18n: I18n,
): Promise<string> {
  const bodyText = i18n._(emailMessages.verifyEmailBody);
  const buttonText = i18n._(emailMessages.verifyEmailButton);

  const { html, errors } = await mjml2html(`
    <mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text>${bodyText}</mj-text>
            <mj-button href="${data.appBaseUrl}/verify-email?token=${data.token}">
              ${buttonText}
            </mj-button>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `);
  if (errors.length) throw new Error(errors.map((e) => e.formattedMessage).join("\n"));
  return html;
}

export async function renderExampleEmail(data: { name: string }): Promise<string> {
  const { html, errors } = await mjml2html(`
    <mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text>Bonjour ${data.name},</mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `);
  if (errors.length) throw new Error(errors.map((e) => e.formattedMessage).join("\n"));
  return html;
}
