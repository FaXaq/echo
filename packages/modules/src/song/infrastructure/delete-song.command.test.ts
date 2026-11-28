import { createOrganizationScope } from "@echo/modules/shared/domain";
import { describe, expect, it } from "vitest";
import { makeScriptedDb } from "../../shared/test-support/scripted-db.js";
import { deleteSongCommandFactory } from "./delete-song.command.kysely.js";

const scope = createOrganizationScope("org-1");

describe("deleteSongCommand", () => {
  it("collects the linked file ids by deleting the links before the song", async () => {
    const { db, queries } = makeScriptedDb((sql) =>
      sql.startsWith('delete from "song_file"') ? [{ file_id: "file-1" }] : [],
    );

    const result = await deleteSongCommandFactory()(db, scope, { id: "song-1" });

    expect(result).toEqual({ fileIds: ["file-1"] });
    const writes = queries.filter((sql) => sql.startsWith("delete"));
    expect(writes[0]).toMatch(/^delete from "song_file" where .* returning "file_id"/);
    expect(writes[1]).toMatch(/^delete from "song" /);
    expect(queries.some((sql) => sql.startsWith('select "file_id" from "song_file"'))).toBe(false);
  });
});
