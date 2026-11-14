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
  occurrence_kind: null,
  occurrence_place_id: null,
  folder_path: null,
  event_title: null,
  event_start_date: null,
  song_title: null,
});

describe("searchDriveQuery", () => {
  it("searches folders, events and songs and resolves files to their oldest occurrence", async () => {
    const { db, queries } = makeScriptedDb();

    await searchDriveQueryFactory()(db, scope, { query: "demo" });

    const sql = queries.join("\n");
    expect(sql).toContain("calendar_event");
    expect(sql).toContain("song_file");
    expect(sql).toContain("event_file");
    expect(sql).toContain("folder_file");
    expect(sql).toContain("DISTINCT ON");
    expect(sql).toContain("ORDER BY file_id, at ASC, kind ASC, place_id ASC");
    expect(sql).toContain("UNION ALL");
  });

  it("returns Event and Song matches as system folders and the oldest occurrence path of files", async () => {
    const { db } = makeScriptedDb((sql) => {
      if (sql.includes('from "calendar_event"'))
        return [{ id: "event-1", title: "Gig", start_date: new Date("2026-03-04T20:00:00Z") }];
      if (sql.includes('from "song"')) return [{ id: "song-1", title: "Demo song" }];
      if (sql.includes("DISTINCT ON"))
        return [
          {
            ...fileRow("file-1"),
            occurrence_kind: "event",
            occurrence_place_id: "event-1",
            event_title: "Gig",
            event_start_date: new Date("2026-03-04T20:00:00Z"),
          },
          {
            ...fileRow("file-2"),
            occurrence_kind: "folder",
            occurrence_place_id: "folder-1",
            folder_path: ["Band", "Demos"],
          },
          { ...fileRow("file-3"), occurrence_kind: "folder", occurrence_place_id: null },
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
