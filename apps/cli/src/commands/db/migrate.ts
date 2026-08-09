import { makeDbMigrator } from "@echo/db";
import type { Command } from "commander";
import { cliConfig } from "../../config/index";

export const registerMigrateCommand = (parent: Command) => {
  parent
    .command("migrate")
    .description("Run pending database migrations")
    .action(async () => {
      const { runMigrations } = makeDbMigrator(cliConfig.db);
      await runMigrations();
    });
};
