import { createOrganizationScope } from "@echo/modules/shared/domain";
import { describe, expect, it } from "vitest";
import { makeScriptedDb } from "../../shared/test-support/scripted-db.js";
import { deleteCalendarEventCommandFactory } from "./delete-calendar-event.command.kysely.js";

const scope = createOrganizationScope("org-1");

describe("deleteCalendarEventCommand", () => {
  it("collects the linked file ids by deleting the links before the event", async () => {
    const { db, queries } = makeScriptedDb((sql) =>
      sql.startsWith('delete from "event_file"') ? [{ file_id: "file-1" }] : [],
    );

    const result = await deleteCalendarEventCommandFactory()(db, scope, { id: "event-1" });

    expect(result).toEqual({ fileIds: ["file-1"] });
    const writes = queries.filter((sql) => sql.startsWith("delete"));
    expect(writes[0]).toMatch(/^delete from "event_file" where .* returning "file_id"/);
    expect(writes[1]).toMatch(/^delete from "calendar_event" /);
    expect(queries.some((sql) => sql.startsWith('select "file_id" from "event_file"'))).toBe(false);
  });
});
