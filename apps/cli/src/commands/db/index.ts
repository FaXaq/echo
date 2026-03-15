import type { Command } from "commander";
import { registerMigrateCommand } from "./migrate";
import { registerMigrateDownCommand } from "./migrate-down";

export const registerDbCommands = (program: Command) => {
  const db = program.command("db").description("Database commands");

  registerMigrateCommand(db);
  registerMigrateDownCommand(db);
};
