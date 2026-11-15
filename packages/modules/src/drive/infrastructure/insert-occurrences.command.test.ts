import { createOrganizationScope } from "@echo/modules/shared/domain";
import { describe, expect, it } from "vitest";
import { makeScriptedDb } from "../../shared/test-support/scripted-db.js";
import { insertOccurrencesCommandFactory } from "./insert-occurrences.command.kysely.js";

const scope = createOrganizationScope("org-1");

describe("insertOccurrencesCommand", () => {
  it.each([
    [{ kind: "root" }, "folder_file"],
    [{ kind: "folder", id: "folder-1" }, "folder_file"],
    [{ kind: "event", id: "event-1" }, "event_file"],
    [{ kind: "song", id: "song-1" }, "song_file"],
  ] as const)("inserts %o into %s ignoring existing occurrences", async (place, table) => {
    const { db, queries } = makeScriptedDb();

    await insertOccurrencesCommandFactory()(db, scope, {
      fileIds: ["file-1", "file-2"],
      place,
      addedBy: "user-1",
    });

    expect(queries).toHaveLength(1);
    expect(queries[0]).toContain(`insert into "${table}"`);
    expect(queries[0]).toContain("on conflict do nothing");
  });

  it("does nothing without files", async () => {
    const { db, queries } = makeScriptedDb();

    await insertOccurrencesCommandFactory()(db, scope, {
      fileIds: [],
      place: { kind: "root" },
      addedBy: "user-1",
    });

    expect(queries).toEqual([]);
  });
});
