import { defineConfig } from "vitest/config";

export const sharedVitestConfig = defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
  },
});
