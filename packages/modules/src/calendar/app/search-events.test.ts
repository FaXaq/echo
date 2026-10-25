import { describe, expect, it, vi } from "vitest";
import { makeDbAdapter } from "@echo/db";
import { ForbiddenError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { searchEvents } from "./search-events.js";

const scope = createOrganizationScope("org-1");

const { db } = makeDbAdapter({
  host: "localhost",
  port: 5432,
  user: "test",
  password: "test",
  name: "test",
});

describe("searchEvents", () => {
  it("rejects a member without calendarEvent:read permission", async () => {
    await expect(
      searchEvents(
        {
          db,
          userHasPermissionInOrganization: async () => ({
            success: false,
            error: null,
            role: null,
          }),
          searchCalendarEventsQuery: async () => [],
        },
        { scope, query: "gig" },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("searches events with the query", async () => {
    const searchCalendarEventsQuery = vi.fn(async () => []);
    await searchEvents(
      {
        db,
        userHasPermissionInOrganization: async () => ({ success: true, error: null, role: null }),
        searchCalendarEventsQuery,
      },
      { scope, query: "gig" },
    );
    expect(searchCalendarEventsQuery).toHaveBeenCalledWith(db, scope, { query: "gig" });
  });
});
