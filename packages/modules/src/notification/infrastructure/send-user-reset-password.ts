import { makeServerI18n, emailMessages } from "@echo/i18n";
import type { MailerPort } from "@echo/adapters/mailer";
import { renderResetPasswordEmail } from "./templates/index.js";

export async function sendUserResetPassword(
  deps: { mailer: MailerPort; appBaseUrl: string },
  input: { to: string; token: string },
): Promise<void> {
  const i18n = makeServerI18n();
  await deps.mailer.send({
    to: input.to,
    subject: i18n._(emailMessages.resetPasswordSubject),
    html: await renderResetPasswordEmail(
      { email: input.to, appBaseUrl: deps.appBaseUrl, token: input.token },
      i18n,
    ),
  });
}
