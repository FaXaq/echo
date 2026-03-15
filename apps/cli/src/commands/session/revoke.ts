import type { Command } from "commander";
import { auth } from "../../adapters/auth";
import { getAdminHeaders } from "../../lib/session";

export const registerSessionRevokeCommand = (parent: Command) => {
  parent
    .command("revoke <userId>")
    .description("Revoke all sessions for a user")
    .action(async (userId: string) => {
      const headers = await getAdminHeaders();

      await auth.api.revokeUserSessions({
        body: { userId },
        headers,
      });

      console.log(`All sessions revoked for user ${userId}.`);
    });
};
