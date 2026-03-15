import nodemailer from "nodemailer";
import type { MailerPort, SendMailOptions } from "@echo/app";

type MailerConfig = { host: string; port: number; from: string };

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
