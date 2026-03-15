import type { Command } from "commander";
import { db } from "../../adapters/db";
import { printOutput } from "../../lib/formatters";

export const registerGetCommand = (parent: Command) => {
  parent
    .command("get <id>")
    .description("Get a user by ID")
    .action(async (id: string) => {
      const result = await db
        .selectFrom("user")
        .selectAll()
        .where("id", "=", id)
        .executeTakeFirst();

      if (!result) {
        console.error(`User not found: ${id}`);
        process.exitCode = 1;
        return;
      }

      const sessions = await db
        .selectFrom("session")
        .select("id")
        .where("user_id", "=", id)
        .execute();

      const accounts = await db
        .selectFrom("account")
        .select("provider_id")
        .where("user_id", "=", id)
        .execute();

      printOutput(
        {
          id: result.id,
          email: result.email,
          name: result.name,
          emailVerified: result.email_verified,
          image: result.image,
          createdAt: result.created_at,
          updatedAt: result.updated_at,
          activeSessions: sessions.length,
          accounts: accounts.map((a) => a.provider_id).join(", "),
        },
        "json",
      );
    });
};
