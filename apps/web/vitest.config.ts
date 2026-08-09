import { defineConfig, mergeConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { lingui } from "@lingui/vite-plugin";
import tsconfigPaths from "vite-tsconfig-paths";
import { sharedVitestConfig } from "@echo/config/vitest.shared";

export default mergeConfig(
  sharedVitestConfig,
  defineConfig({
    plugins: [
      tsconfigPaths(),
      react({ babel: { plugins: ["@lingui/babel-plugin-lingui-macro"] } }),
      lingui(),
    ],
    test: {
      environment: "jsdom",
      setupFiles: ["./src/vitest.setup.ts"],
    },
  }),
);
