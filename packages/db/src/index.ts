import type { makeDbAdapter } from "./adapters/db";
export * from "./adapters/db";

export type KyselyDB = ReturnType<typeof makeDbAdapter>["db"];
export type { DB } from "./schema.d";
export * from "./migrator";
export { generateOrgSlug } from "./generate-org-slug";
