import type { Command } from "commander";
import { auth } from "../../adapters/auth";
import { getAdminHeaders } from "../../lib/session";

export const registerBanCommand = (parent: Command) => {
  parent
    .command("ban <id>")
    .description("Ban a user")
    .option("--reason <reason>", "Ban reason")
    .option("--expires <date>", "Ban expiration (ISO date)")
    .requiredOption("--confirm", "Confirm ban")
    .action(async (id: string, opts) => {
      const headers = await getAdminHeaders();

      await auth.api.banUser({
        body: {
          userId: id,
          ...(opts.reason ? { banReason: opts.reason } : {}),
          ...(opts.expires
            ? { banExpiresIn: new Date(opts.expires).getTime() - Date.now() }
            : {}),
        },
        headers,
      });

      console.log(`User ${id} banned.`);
    });
};
