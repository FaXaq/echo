import type { Command } from "commander";
import { auth } from "../../adapters/auth";
import { getAdminHeaders } from "../../lib/session";
import { printOutput } from "../../lib/formatters";

export const registerListCommand = (parent: Command) => {
  parent
    .command("list")
    .description("List users")
    .option("--search <query>", "Search by name or email")
    .option("--limit <n>", "Max results", "50")
    .option("--offset <n>", "Skip results", "0")
    .action(async (opts) => {
      const headers = await getAdminHeaders();

      const result = await auth.api.listUsers({
        headers,
        query: {
          limit: Number(opts.limit),
          offset: Number(opts.offset),
          ...(opts.search ? { searchField: "email", searchValue: opts.search } : {}),
        },
      });

      const rows = result.users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        banned: u.banned,
        createdAt: u.createdAt,
      }));

      printOutput(rows);
      console.error(`\nTotal: ${result.total}`);
    });
};
