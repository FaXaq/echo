import i18next from "i18next";
import en from "../locales/en.json" with { type: "json" };
import fr from "../locales/fr.json" with { type: "json" };

export const resources = {
  en,
  fr,
} as const;

export type AppResources = typeof resources;

type Namespace = keyof AppResources["en"];
type TranslationKey<N extends Namespace> = keyof AppResources["en"][N] & string;

/**
 * Create a synchronous i18n instance for server-side use (e.g., email templates).
 * Does not require async initialization since resources are provided upfront.
 */
export const makeServerI18n = (lang = "fr") => {
  const i18n = i18next.createInstance();
  i18n.init({
    resources,
    lng: lang,
    fallbackLng: "fr",
    initImmediate: false,
  });

  const t = <N extends Namespace>(
    ns: N,
    key: TranslationKey<N>,
    vars?: Record<string, string>,
  ): string => {
    const result = i18n.t(key, { ns, ...vars });
    return typeof result === "string" ? result : key;
  };

  return t;
};
