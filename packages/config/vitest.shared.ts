import { defineConfig } from "vitest/config";

export const sharedVitestConfig = defineConfig({
  test: {
    globals: true,
    reporters: process.env.VITEST_QUIET ? ["dot"] : ["default"],
    passWithNoTests: true,
    testTimeout: 15_000,
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
