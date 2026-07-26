export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export interface MailerPort {
  send: (options: SendMailOptions) => Promise<void>;
}

export type MailerConfig = { host: string; port: number; from: string };
