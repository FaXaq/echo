import {
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import type { DB } from "@echo/db";
import { describe, expect, it } from "vitest";
import { markFileHasThumbnailCommandFactory } from "./mark-file-has-thumbnail.command.kysely.js";

describe("markFileHasThumbnailCommand", () => {
  it("records the thumbnail without changing the file's last modified date", async () => {
    const queries: string[] = [];
    const db = new Kysely<DB>({
      dialect: {
        createAdapter: () => new PostgresAdapter(),
        createDriver: () => new DummyDriver(),
        createIntrospector: (introspected) => new PostgresIntrospector(introspected),
        createQueryCompiler: () => new PostgresQueryCompiler(),
      },
      log: (event) => {
        queries.push(event.query.sql);
      },
    });

    await markFileHasThumbnailCommandFactory()(db, { id: "file-1" });

    expect(queries).toHaveLength(1);
    expect(queries[0]).toContain('"has_thumbnail"');
    expect(queries[0]).not.toContain('"updated_at"');
  });
});
