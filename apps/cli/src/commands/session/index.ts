import type { Command } from "commander";
import { registerSessionListCommand } from "./list";
import { registerSessionRevokeCommand } from "./revoke";

export const registerSessionCommands = (program: Command) => {
  const sess = program.command("session").description("Session management commands");

  registerSessionListCommand(sess);
  registerSessionRevokeCommand(sess);
};
