import { defineConfig, mergeConfig } from "vitest/config";
import { sharedVitestConfig } from "@echo/config/vitest.shared";

export default mergeConfig(sharedVitestConfig, defineConfig({}));
