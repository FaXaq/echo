import { setupI18n } from "@lingui/core";
import { compileMessage } from "@lingui/message-utils/compileMessage";
import { messages as en } from "../locales/en/messages";
import { messages as fr } from "../locales/fr/messages";
import { emailTranslationsFr } from "./email-messages";

export const catalogs = { en, fr };

export type Locale = keyof typeof catalogs;
export const locales: Locale[] = ["en", "fr"];

export const toLocale = (value: string | null | undefined): Locale =>
  value === "en" || value === "fr" ? value : "fr";

/**
 * Create a synchronous i18n instance for server-side use (e.g., email templates).
 * A fresh instance per call keeps concurrent sends on different locales isolated.
 *
 * Registers a message compiler so the hand-maintained email translations (raw
 * strings, not pre-compiled by `lingui compile`) still interpolate correctly.
 */
export const makeServerI18n = (locale: Locale = "fr") => {
  const i18n = setupI18n({
    locale,
    messages: { en, fr: { ...fr, ...emailTranslationsFr } },
  });
  i18n.setMessagesCompiler(compileMessage);
  return i18n;
};

export { emailMessages } from "./email-messages";
