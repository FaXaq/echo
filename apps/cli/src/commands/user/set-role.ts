import type { Command } from "commander";
import { systemRoleSchema } from "@echo/auth";
import { auth } from "../../adapters/auth";
import { getAdminHeaders } from "../../lib/session";

export const registerSetRoleCommand = (parent: Command) => {
  parent
    .command("set-role <id> <role>")
    .description("Set a user's role (client or admin)")
    .requiredOption("--confirm", "Confirm role change")
    .action(async (id: string, role: string) => {
      const parsedRole = systemRoleSchema.parse(role);
      const headers = await getAdminHeaders();

      await auth.api.setRole({
        body: { userId: id, role: parsedRole },
        headers,
      });

      console.log(`User ${id} role set to "${role}".`);
    });
};
