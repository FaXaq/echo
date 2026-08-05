import { defineConfig, mergeConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { sharedVitestConfig } from "@echo/config/vitest.shared";

export default mergeConfig(
  sharedVitestConfig,
  defineConfig({
    plugins: [tsconfigPaths(), react()],
    test: {
      environment: "jsdom",
      setupFiles: ["./src/vitest.setup.ts"],
    },
  }),
);
