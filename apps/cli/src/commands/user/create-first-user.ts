import type { Command } from "commander";
import { auth } from "../../adapters/auth";
import { printOutput } from "../../lib/formatters";
import { cliConfig } from "../../config/index";

export const registerCreateFirstUserCommand = (parent: Command) => {
  parent
    .command("create-first-user")
    .description("Create the first user")
    .action(async () => {
      const result = await auth.api.createUser({
        body: {
          email: cliConfig.admin.email,
          name: "Tech Admin",
          password: cliConfig.admin.password,
          role: "admin",
          data: {
            firstName: "Tech",
            lastName: "Admin",
          },
        },
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
