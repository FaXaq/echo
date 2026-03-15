import type { Command } from "commander";
import { auth } from "../../adapters/auth";
import { getAdminHeaders } from "../../lib/session";
import { printOutput } from "../../lib/formatters";

export const registerCreateCommand = (parent: Command) => {
  parent
    .command("create")
    .description("Create a new user")
    .requiredOption("--email <email>", "User email")
    .requiredOption("--name <name>", "User name")
    .requiredOption("--password <password>", "User password")
    .option("--role <role>", "User role (user or admin)", "user")
    .action(async (opts) => {
      const headers = await getAdminHeaders();

      const result = await auth.api.createUser({
        body: {
          email: opts.email,
          name: opts.name,
          password: opts.password,
          role: opts.role,
        },
        headers,
      });

      const created = result.user;

      printOutput({
        id: created.id,
        email: created.email,
        name: created.name,
        role: created.role,
        createdAt: created.createdAt,
      });
    });
};
