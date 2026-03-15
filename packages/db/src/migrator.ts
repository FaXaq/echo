import { Migrator, FileMigrationProvider } from "kysely";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeDbAdapter, type DBConfig } from "./adapters/db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const makeDbMigrator = (dbConfig: DBConfig) => {
  const runMigrations = async () => {
    const { db, pool } = makeDbAdapter(dbConfig);

    console.log("⏳ Running migrations...");

    const migrator = new Migrator({
      db,
      provider: new FileMigrationProvider({
        fs,
        path,
        migrationFolder: path.join(__dirname, "../migrations"),
      }),
    });

    const { error, results } = await migrator.migrateToLatest();

    for (const result of results ?? []) {
      if (result.status === "Success") {
        console.log(`✅ Migration "${result.migrationName}" applied`);
      } else if (result.status === "Error") {
        console.error(`❌ Migration "${result.migrationName}" failed`);
      }
    }

    if (error) {
      console.error("Migration failed:", error);
      await pool.end();
      process.exit(1);
    }

    await pool.end();
    console.log("✅ Migrations completed!");
  };

  const migrateDown = async () => {
    const { db, pool } = makeDbAdapter(dbConfig);

    console.log("⏳ Rolling back last migration...");

    const migrator = new Migrator({
      db,
      provider: new FileMigrationProvider({
        fs,
        path,
        migrationFolder: path.join(__dirname, "../migrations"),
      }),
    });

    const { error, results } = await migrator.migrateDown();

    for (const result of results ?? []) {
      if (result.status === "Success") {
        console.log(`✅ Migration "${result.migrationName}" rolled back`);
      } else if (result.status === "Error") {
        console.error(`❌ Migration "${result.migrationName}" failed to roll back`);
      }
    }

    if (error) {
      console.error("Rollback failed:", error);
      await pool.end();
      process.exit(1);
    }

    await pool.end();
    console.log("✅ Rollback completed!");
  };

  return { runMigrations, migrateDown };
};
