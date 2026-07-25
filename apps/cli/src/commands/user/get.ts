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
        .where("userId", "=", id)
        .execute();

      const accounts = await db
        .selectFrom("account")
        .select("providerId")
        .where("userId", "=", id)
        .execute();

      printOutput(
        {
          id: result.id,
          email: result.email,
          name: result.name,
          emailVerified: result.emailVerified,
          image: result.image,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
          activeSessions: sessions.length,
          accounts: accounts.map((a) => a.providerId).join(", "),
        },
        "json",
      );
    });
};
