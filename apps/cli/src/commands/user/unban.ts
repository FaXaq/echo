import type { Command } from "commander";
import { auth } from "../../adapters/auth";
import { getAdminHeaders } from "../../lib/session";

export const registerUnbanCommand = (parent: Command) => {
  parent
    .command("unban <id>")
    .description("Unban a user")
    .action(async (id: string) => {
      const headers = await getAdminHeaders();

      await auth.api.unbanUser({
        body: { userId: id },
        headers,
      });

      console.log(`User ${id} unbanned.`);
    });
};
