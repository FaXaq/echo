import type { Command } from "commander";
import { db } from "../../adapters/db";
import { printOutput } from "../../lib/formatters";

export const registerUpdateCommand = (parent: Command) => {
  parent
    .command("update <id>")
    .description("Update a user")
    .option("--name <name>", "New name")
    .option("--email <email>", "New email")
    .action(async (id: string, opts) => {
      const updates: Record<string, string> = {};
      if (opts.name) updates.name = opts.name;
      if (opts.email) updates.email = opts.email;

      if (Object.keys(updates).length === 0) {
        console.error("No updates specified. Use --name or --email.");
        process.exitCode = 1;
        return;
      }

      const updated = await db
        .updateTable("user")
        .set(updates)
        .where("id", "=", id)
        .returningAll()
        .executeTakeFirst();

      if (!updated) {
        console.error(`User not found: ${id}`);
        process.exitCode = 1;
        return;
      }

      printOutput({
        id: updated.id,
        email: updated.email,
        name: updated.name,
      });
    });
};
