import mjml2html from "mjml";
import type { makeServerI18n } from "@echo/i18n";

type T = ReturnType<typeof makeServerI18n>;

export async function renderInvitationEmail(
  data: {
    orgName: string;
    invitationId: string;
    appBaseUrl: string;
  },
  t: T,
): Promise<string> {
  const bodyText = t("emails", "You have been invited to join {{orgName}}", {
    orgName: data.orgName,
  });
  const buttonText = t("emails", "Accept invitation");

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
  t: T,
): Promise<string> {
  const bodyText = t("emails", "You requested a password reset.");
  const buttonText = t("emails", "Reset my password");

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
  if (errors.length)
    throw new Error(errors.map((e) => e.formattedMessage).join("\n"));
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
  if (errors.length)
    throw new Error(errors.map((e) => e.formattedMessage).join("\n"));
  return html;
}
