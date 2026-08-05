import { makeServerI18n } from "@echo/i18n";
import type { MailerPort } from "@echo/adapters/mailer";
import { renderResetPasswordEmail } from "./templates/index.js";

export async function sendUserResetPassword(
  deps: { mailer: MailerPort; appBaseUrl: string },
  input: { to: string; token: string },
): Promise<void> {
  const t = makeServerI18n();
  await deps.mailer.send({
    to: input.to,
    subject: t("emails", "Reset your Echo password"),
    html: await renderResetPasswordEmail(
      { email: input.to, appBaseUrl: deps.appBaseUrl, token: input.token },
      t,
    ),
  });
}
