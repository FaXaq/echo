import { setupI18n } from "@lingui/core";
import { messages as en } from "../locales/en/messages";
import { messages as fr } from "../locales/fr/messages";

export const catalogs = { en, fr };

export type Locale = keyof typeof catalogs;
export const locales: Locale[] = ["en", "fr"];

export const toLocale = (value: string | null | undefined): Locale =>
  value === "en" || value === "fr" ? value : "fr";

/**
 * Create a synchronous i18n instance for server-side use (e.g., email templates).
 * A fresh instance per call keeps concurrent sends on different locales isolated.
 */
export const makeServerI18n = (locale: Locale = "fr") => setupI18n({ locale, messages: catalogs });

export { emailMessages } from "./email-messages";
