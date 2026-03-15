import { makeDbMigrator } from "@echo/db";
import { Command } from "commander";
import { cliConfig } from "../../config/index";

export const registerMigrateDownCommand = (parent: Command) => {
  parent
    .command("migrate-down")
    .description("Roll back the last database migration")
    .action(async () => {
      const { migrateDown } = makeDbMigrator(cliConfig.db);
      await migrateDown();
    });
};
