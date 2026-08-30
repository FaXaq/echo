import { testDbConnection } from "@echo/db";
import type { Command } from "commander";
import { cliConfig } from "../../config/index";

export const registerTestCommand = (parent: Command) => {
  parent
    .command("test")
    .description("Test the database connection")
    .action(async () => {
      console.log("⏳ Testing database connection...");

      try {
        await testDbConnection(cliConfig.db);
        console.log("✅ Database connection successful!");
      } catch (error) {
        console.error("❌ Database connection failed:", error);
        process.exit(1);
      }
    });
};
