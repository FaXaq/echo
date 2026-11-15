import { createOrganizationScope } from "@echo/modules/shared/domain";
import { describe, expect, it } from "vitest";
import { makeScriptedDb } from "../../shared/test-support/scripted-db.js";
import { moveFilesToFolderCommandFactory } from "./move-files-to-folder.command.kysely.js";
import type { MoveFilesToFolderInput } from "./move-files-to-folder.command.port.js";

const scope = createOrganizationScope("org-1");
const input: MoveFilesToFolderInput = {
  ids: ["file-1", "file-2"],
  from: { kind: "root" },
  folderId: "target",
};

function makePlacementsDb(placed: { atSource: string[]; atTarget: string[] }) {
  return makeScriptedDb((sql) => {
    if (!sql.startsWith('select "file_id" from "folder_file"')) return [];
    const ids = sql.includes('"folder_id" is null') ? placed.atSource : placed.atTarget;
    return ids.map((file_id) => ({ file_id }));
  });
}

const placementWrites = (queries: string[]) =>
  queries.filter((sql) => sql.includes('"folder_file"') && !sql.startsWith("select"));

describe("moveFilesToFolderCommand", () => {
  it("moves every file's source placement in one update", async () => {
    const { db, queries } = makePlacementsDb({ atSource: ["file-1", "file-2"], atTarget: [] });

    await expect(moveFilesToFolderCommandFactory()(db, scope, input)).resolves.toBe(true);

    expect(placementWrites(queries)).toEqual([
      expect.stringMatching(
        /^update "folder_file" set "folder_id" = \$1 where "file_id" in \(\$2, \$3\) and "folder_id" is null/,
      ),
    ]);
  });

  it("drops the source placement of files already placed at the target", async () => {
    const { db, queries } = makePlacementsDb({
      atSource: ["file-1", "file-2"],
      atTarget: ["file-2"],
    });

    await moveFilesToFolderCommandFactory()(db, scope, input);

    expect(placementWrites(queries)).toEqual([
      expect.stringMatching(/^delete from "folder_file" where "file_id" in \(\$1\)/),
      expect.stringMatching(/^update "folder_file" .* where "file_id" in \(\$2\)/),
    ]);
  });

  it("changes nothing when a file has no placement at the source", async () => {
    const { db, queries } = makePlacementsDb({ atSource: ["file-1"], atTarget: [] });

    await expect(moveFilesToFolderCommandFactory()(db, scope, input)).resolves.toBe(false);

    expect(queries.some((sql) => sql.startsWith("update") || sql.startsWith("delete"))).toBe(false);
  });
});
