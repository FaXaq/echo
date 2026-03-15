import type { Command } from "commander";
import { auth } from "../../adapters/auth";
import { getAdminHeaders } from "../../lib/session";

export const registerDeleteCommand = (parent: Command) => {
  parent
    .command("delete <id>")
    .description("Delete a user")
    .requiredOption("--confirm", "Confirm deletion")
    .action(async (id: string) => {
      const headers = await getAdminHeaders();

      await auth.api.removeUser({
        body: { userId: id },
        headers,
      });

      console.log(`User ${id} deleted.`);
    });
};
