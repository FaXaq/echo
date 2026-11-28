import { createOrganizationScope } from "@echo/modules/shared/domain";
import { describe, expect, it } from "vitest";
import { makeScriptedDb } from "../../shared/test-support/scripted-db.js";
import { previewFolderDeleteQueryFactory } from "./preview-folder-delete.query.kysely.js";

const scope = createOrganizationScope("org-1");

describe("previewFolderDeleteQuery", () => {
  it("counts files whose occurrences all sit in the subtree as deleted, the others as kept", async () => {
    const { db, queries } = makeScriptedDb((sql) =>
      sql.includes("recursive")
        ? [{ id: "folder-1" }, { id: "folder-2" }]
        : [
            { id: "file-1", kept: false },
            { id: "file-2", kept: true },
            { id: "file-3", kept: false },
          ],
    );

    const result = await previewFolderDeleteQueryFactory()(db, scope, { id: "folder-1" });

    expect(result).toEqual({ deletedCount: 2, keptCount: 1 });
    const sql = queries.join("\n");
    expect(sql).toContain("event_file");
    expect(sql).toContain("song_file");
    expect(sql).toContain("folder_file");
  });
});
