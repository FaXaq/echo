export type { MailerPort, SendMailOptions, MailerConfig } from "./mailer.port.js";
export { makeMailer } from "./mailer.nodemailer.js";

export type { EmailNotifierPort } from "./email-notifier.port.js";
export { makeEmailNotifierRepo } from "./email-notifier.js";

export { renderInvitationEmail, renderResetPasswordEmail } from "./templates/index.js";
