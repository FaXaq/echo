import { createOrganizationScope } from "@echo/modules/shared/domain";
import { describe, expect, it } from "vitest";
import { makeScriptedDb } from "../../shared/test-support/scripted-db.js";
import { listFolderContentsQueryFactory } from "./list-folder-contents.query.kysely.js";

const scope = createOrganizationScope("org-1");

const folderRow = (id: string, name: string) => ({
  id,
  organization_id: "org-1",
  parent_folder_id: null,
  name,
  created_at: null,
  updated_at: null,
});

const respondWithFolders = (sql: string) => {
  if (sql.includes("recursive")) {
    return [
      { root_id: "a", total: "100" },
      { root_id: "c", total: "5000" },
    ];
  }
  if (sql.includes('from "folder"')) {
    return [folderRow("a", "Alpha"), folderRow("b", "Beta"), folderRow("c", "Gamma")];
  }
  return [];
};

describe("listFolderContentsQuery folder sizes", () => {
  it("sums the distinct uploaded files of each listed folder's subtree", async () => {
    const { db, queries } = makeScriptedDb(respondWithFolders);

    const result = await listFolderContentsQueryFactory()(db, scope, {
      location: { kind: "root" },
      sort: { field: "name", order: "asc" },
    });

    expect(result.folders.map((folder) => [folder.name, folder.sizeBytes])).toEqual([
      ["Alpha", 100],
      ["Beta", 0],
      ["Gamma", 5000],
    ]);
    const sql = queries.find((query) => query.includes("recursive")) ?? "";
    expect(sql).toContain("sum");
    expect(sql).toContain("distinct");
    expect(sql).toContain("folder_file");
    expect(sql).toContain('"file"."status" = $');
  });

  it("orders folders by size when sorting on sizeBytes", async () => {
    const { db } = makeScriptedDb(respondWithFolders);

    const result = await listFolderContentsQueryFactory()(db, scope, {
      location: { kind: "root" },
      sort: { field: "sizeBytes", order: "desc" },
    });

    expect(result.folders.map((folder) => folder.name)).toEqual(["Gamma", "Alpha", "Beta"]);
  });

  it("sizes the Events and Songs roots from the files linked to any event or song", async () => {
    const { db, queries } = makeScriptedDb((sql) => {
      if (sql.includes('from "event_file"')) return [{ total: "700" }];
      if (sql.includes('from "song_file"')) return [{ total: "30" }];
      return [];
    });

    const result = await listFolderContentsQueryFactory()(db, scope, {
      location: { kind: "root" },
      sort: { field: "name", order: "desc" },
    });

    expect(result.systemFolders).toEqual([
      { location: { kind: "events" }, name: "Events", sizeBytes: 700 },
      { location: { kind: "songs" }, name: "Songs", sizeBytes: 30 },
    ]);
    expect(queries.join("\n")).toContain("sum");
  });

  it("sizes each Event folder from its linked files", async () => {
    const { db } = makeScriptedDb((sql) => {
      if (sql.includes("sum")) return [{ owner_id: "event-1", total: "42" }];
      if (sql.includes("calendar_event")) {
        return [
          { id: "event-1", title: "Gig", start_date: new Date("2026-01-01T00:00:00Z") },
          { id: "event-2", title: "Rehearsal", start_date: new Date("2026-01-02T00:00:00Z") },
        ];
      }
      return [];
    });

    const result = await listFolderContentsQueryFactory()(db, scope, {
      location: { kind: "events" },
      sort: { field: "name", order: "asc" },
    });

    expect(result.systemFolders.map((entry) => [entry.location, entry.sizeBytes])).toEqual([
      [{ kind: "event", id: "event-1" }, 42],
      [{ kind: "event", id: "event-2" }, 0],
    ]);
  });

  it("sizes each Song folder and sorts them by size", async () => {
    const { db } = makeScriptedDb((sql) => {
      if (sql.includes("sum")) return [{ owner_id: "song-2", total: "9" }];
      if (sql.includes('from "song"')) {
        return [
          { id: "song-1", title: "Aaa" },
          { id: "song-2", title: "Bbb" },
        ];
      }
      return [];
    });

    const result = await listFolderContentsQueryFactory()(db, scope, {
      location: { kind: "songs" },
      sort: { field: "sizeBytes", order: "desc" },
    });

    expect(result.systemFolders.map((entry) => entry.name)).toEqual(["Bbb", "Aaa"]);
  });
});
