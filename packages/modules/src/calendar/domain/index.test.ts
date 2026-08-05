import { describe, expect, it } from "vitest";
import { EVENT_TYPES, eventTypeSchema } from "./index.js";

describe("eventTypeSchema", () => {
  it("accepts each known event type", () => {
    for (const type of ["unavailability", "rehearsal", "concert", "meeting"]) {
      expect(eventTypeSchema.parse(type)).toBe(type);
    }
  });

  it("rejects an unknown value", () => {
    expect(eventTypeSchema.safeParse("bogus").success).toBe(false);
  });
});

describe("EVENT_TYPES", () => {
  it("lists exactly the four known types", () => {
    expect(EVENT_TYPES).toEqual(["unavailability", "rehearsal", "concert", "meeting"]);
  });
});
