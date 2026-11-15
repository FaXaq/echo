import { createOrganizationScope } from "@echo/modules/shared/domain";
import { describe, expect, it } from "vitest";
import { makeScriptedDb } from "../../shared/test-support/scripted-db.js";
import { searchDriveQueryFactory } from "./search-drive.query.kysely.js";

const scope = createOrganizationScope("org-1");

const fileRow = (id: string) => ({
  id,
  organization_id: "org-1",
  uploaded_by: "user-1",
  uploaded_by_name: "Test User",
  kind: "audio",
  mime_type: "audio/mpeg",
  size_bytes: 1,
  duration_seconds: null,
  width: null,
  height: null,
  has_thumbnail: false,
  filename: `${id}.mp3`,
  original_filename: `${id}.mp3`,
  s3_key: `org/org-1/${id}`,
  status: "uploaded",
  created_at: null,
  updated_at: null,
});

const earlier = new Date("2026-01-01T00:00:00Z");
const later = new Date("2026-02-01T00:00:00Z");

describe("searchDriveQuery", () => {
  it("matches names case-insensitively, escaping LIKE wildcards", async () => {
    const { db, queries } = makeScriptedDb();

    await searchDriveQueryFactory()(db, scope, { query: "50%_off" });

    expect(queries.filter((sql) => sql.includes(" ilike $"))).toHaveLength(4);
    expect(queries.some((sql) => /\bsql\b|strpos/.test(sql))).toBe(false);
  });

  it("returns Event and Song matches as system folders and files at their oldest occurrence", async () => {
    const { db } = makeScriptedDb((sql) => {
      if (sql.startsWith("with recursive"))
        return [
          { leaf_id: "folder-1", id: "folder-0", name: "Band" },
          { leaf_id: "folder-1", id: "folder-1", name: "Demos" },
        ];
      if (sql.includes('from "calendar_event"') && !sql.includes("event_file"))
        return [{ id: "event-1", title: "Gig", start_date: new Date("2026-03-04T20:00:00Z") }];
      if (sql.includes('from "song"') && !sql.includes("song_file"))
        return [{ id: "song-1", title: "Demo song" }];
      if (sql.includes('from "file"'))
        return [fileRow("file-1"), fileRow("file-2"), fileRow("file-3")];
      if (sql.includes('from "event_file"'))
        return [
          {
            file_id: "file-1",
            id: "event-1",
            title: "Gig",
            start_date: new Date("2026-03-04T20:00:00Z"),
            at: earlier,
          },
        ];
      if (sql.includes('from "folder_file"'))
        return [
          { file_id: "file-1", folder_id: null, at: later },
          { file_id: "file-2", folder_id: "folder-1", at: earlier },
        ];
      return [];
    });

    const result = await searchDriveQueryFactory()(db, scope, { query: "demo" });

    expect(result.folders).toEqual(
      [
        { location: { kind: "song", id: "song-1" }, name: "Demo song", path: ["Songs"] },
        { location: { kind: "event", id: "event-1" }, name: "2026-03-04 · Gig", path: ["Events"] },
      ].sort((a, b) => a.name.localeCompare(b.name)),
    );
    expect(result.files.map((file) => [file.id, file.location, file.path])).toEqual([
      ["file-1", { kind: "event", id: "event-1" }, ["Events", "2026-03-04 · Gig"]],
      ["file-2", { kind: "folder", id: "folder-1" }, ["Band", "Demos"]],
      ["file-3", { kind: "root" }, []],
    ]);
  });
});
