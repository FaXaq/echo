import { makeDbMigrator } from "@echo/db";
import type { Command } from "commander";
import { getMigrations } from "better-auth/db/migration";
import { auth } from "../../adapters/auth";
import { cliConfig } from "../../config/index";

export const registerMigrateCommand = (parent: Command) => {
  parent
    .command("migrate")
    .description("Run pending database migrations")
    .action(async () => {
      const { runMigrations: runAuthMigrations } = await getMigrations(auth.options);
      await runAuthMigrations();

      const { runMigrations } = makeDbMigrator(cliConfig.db);
      await runMigrations();
    });
};
