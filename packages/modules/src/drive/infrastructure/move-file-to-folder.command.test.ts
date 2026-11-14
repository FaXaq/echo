import { createOrganizationScope } from "@echo/modules/shared/domain";
import { describe, expect, it } from "vitest";
import { makeScriptedDb } from "../../shared/test-support/scripted-db.js";
import { moveFileToFolderCommandFactory } from "./move-file-to-folder.command.kysely.js";

const scope = createOrganizationScope("org-1");

function makePlacementsDb(placedIn: Set<string | null>) {
  return makeScriptedDb((sql) => {
    if (sql.startsWith('select "file"."id"')) return [{ id: "file-1" }];
    if (sql.includes('select "file_id" from "folder_file"')) {
      const folderId = sql.includes('"folder_id" is null') ? null : "target";
      return placedIn.has(folderId) ? [{ file_id: "file-1" }] : [];
    }
    return [];
  });
}

describe("moveFileToFolderCommand", () => {
  it("moves only the source placement, leaving the file's other folder placements", async () => {
    const { db, queries } = makePlacementsDb(new Set([null, "other"]));

    await moveFileToFolderCommandFactory()(db, scope, {
      id: "file-1",
      from: { kind: "root" },
      folderId: "target",
    });

    const placementWrites = queries.filter(
      (sql) => sql.includes('"folder_file"') && !sql.startsWith("select"),
    );
    expect(placementWrites).toHaveLength(1);
    expect(placementWrites[0]).toMatch(
      /^update "folder_file" set "folder_id" = \$1 where "file_id" = \$2 and "folder_id" is null/,
    );
  });

  it("drops the source placement when the file is already placed at the target", async () => {
    const { db, queries } = makePlacementsDb(new Set([null, "target"]));

    await moveFileToFolderCommandFactory()(db, scope, {
      id: "file-1",
      from: { kind: "root" },
      folderId: "target",
    });

    const placementWrites = queries.filter(
      (sql) => sql.includes('"folder_file"') && !sql.startsWith("select"),
    );
    expect(placementWrites).toHaveLength(1);
    expect(placementWrites[0]).toMatch(/^delete from "folder_file"/);
  });

  it("changes nothing when the file has no placement at the source", async () => {
    const { db, queries } = makePlacementsDb(new Set(["other"]));

    const result = await moveFileToFolderCommandFactory()(db, scope, {
      id: "file-1",
      from: { kind: "root" },
      folderId: "target",
    });

    expect(result).toBeNull();
    expect(queries.some((sql) => sql.startsWith("update"))).toBe(false);
    expect(queries.some((sql) => sql.startsWith("delete"))).toBe(false);
  });
});
