import { defineConfig } from "@lingui/cli";

export default defineConfig({
  sourceLocale: "en",
  locales: ["en", "fr"],
  catalogs: [
    {
      path: "<rootDir>/packages/i18n/locales/{locale}/messages",
      include: ["apps/web/src"],
    },
  ],
});
