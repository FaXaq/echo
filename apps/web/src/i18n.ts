import { i18n } from "@lingui/core";
import { catalogs, toLocale, type Locale } from "@echo/i18n";

export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "fr";
  return toLocale(navigator.language?.split("-")[0]);
}

i18n.load(catalogs);
i18n.activate(detectBrowserLocale());
