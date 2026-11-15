import { createOrganizationScope } from "@echo/modules/shared/domain";
import { describe, expect, it } from "vitest";
import { makeScriptedDb } from "../../shared/test-support/scripted-db.js";
import { deleteFolderCascadeCommandFactory } from "./delete-folder-cascade.command.kysely.js";

const scope = createOrganizationScope("org-1");

describe("deleteFolderCascadeCommand", () => {
  it("collects the placed file ids by deleting them before the folder", async () => {
    const { db, queries } = makeScriptedDb((sql) => {
      if (sql.startsWith("with recursive")) return [{ id: "folder-1" }, { id: "folder-2" }];
      if (sql.startsWith('delete from "folder_file"')) {
        return [{ file_id: "file-1" }, { file_id: "file-2" }, { file_id: "file-1" }];
      }
      return [];
    });

    const result = await deleteFolderCascadeCommandFactory()(db, scope, { id: "folder-1" });

    expect(result).toEqual({ fileIds: ["file-1", "file-2"] });
    const writes = queries.filter((sql) => sql.startsWith("delete"));
    expect(writes[0]).toMatch(
      /^delete from "folder_file" where "folder_id" in .* returning "file_id"/,
    );
    expect(writes[1]).toMatch(/^delete from "folder" /);
    expect(queries.some((sql) => sql.startsWith('select "file_id" from "folder_file"'))).toBe(
      false,
    );
  });
});
