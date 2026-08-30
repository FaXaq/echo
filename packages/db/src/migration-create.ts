import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const name = process.argv[2];

if (!name) {
  console.error("Usage: pnpm migration:create <migration-name>");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const timestamp = new Date()
  .toISOString()
  .replace(/[-T:.Z]/g, "")
  .slice(0, 14);
const filename = `${timestamp}_${name}.ts`;
const filepath = path.join(__dirname, "../migrations", filename);

const template = `import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  // TODO: implement migration
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // TODO: implement rollback
}
`;

writeFileSync(filepath, template);
console.log(`✅ Created migration: migrations/${filename}`);
console.log(`⚠️  Add it to migrations/index.ts (import + "${timestamp}_${name}" key)`);
