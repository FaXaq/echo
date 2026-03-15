import type { Command } from "commander";
import { registerCreateCommand } from "./create";
import { registerListCommand } from "./list";
import { registerGetCommand } from "./get";
import { registerUpdateCommand } from "./update";
import { registerDeleteCommand } from "./delete";
import { registerSetRoleCommand } from "./set-role";
import { registerBanCommand } from "./ban";
import { registerUnbanCommand } from "./unban";
import { registerCreateFirstUserCommand } from "./create-first-user";

export const registerUserCommands = (program: Command) => {
  const user = program.command("user").description("User management commands");

  registerCreateCommand(user);
  registerListCommand(user);
  registerGetCommand(user);
  registerUpdateCommand(user);
  registerDeleteCommand(user);
  registerSetRoleCommand(user);
  registerBanCommand(user);
  registerUnbanCommand(user);
  registerCreateFirstUserCommand(user);
};
