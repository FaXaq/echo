import type { Command } from "commander";
import { auth } from "../../adapters/auth";
import { getAdminHeaders } from "../../lib/session";
import { printOutput } from "../../lib/formatters";

export const registerSessionListCommand = (parent: Command) => {
  parent
    .command("list <userId>")
    .description("List sessions for a user")
    .action(async (userId: string) => {
      const headers = await getAdminHeaders();

      const result = await auth.api.listSessions({
        headers,
        query: { userId },
      });

      if (!result || result.length === 0) {
        console.log("No active sessions.");
        return;
      }

      const rows = result.map((s) => ({
        id: s.id,
        token: s.token.slice(0, 8) + "...",
        ipAddress: s.ipAddress,
        userAgent: s.userAgent?.slice(0, 40),
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      }));

      printOutput(rows);
    });
};
