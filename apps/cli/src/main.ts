import { program } from "commander";
import { pool } from "./adapters/db";
import { registerUserCommands } from "./commands/user/index";
import { registerSessionCommands } from "./commands/session/index";
import { registerDbCommands } from "./commands/db/index";

program
  .name("echo")
  .description("Echo administration CLI")
  .version("0.1.0");

registerUserCommands(program);
registerSessionCommands(program);
registerDbCommands(program);

try {
  await program.parseAsync(process.argv);
} finally {
  await pool.end();
}
