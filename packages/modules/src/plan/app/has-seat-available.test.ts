import { describe, expect, it } from "vitest";
import { seatIsAvailable } from "./has-seat-available.js";
import { planCatalog } from "../domain/index.js";

describe("seatIsAvailable", () => {
  it("allows a join when seats remain", () => {
    expect(seatIsAvailable({ used: 2, limit: planCatalog.free.limits.memberSeats })).toBe(true);
  });

  it("rejects a join when seats are exactly full", () => {
    expect(seatIsAvailable({ used: 3, limit: planCatalog.free.limits.memberSeats })).toBe(false);
  });

  it("rejects a join when already over the seat limit", () => {
    expect(seatIsAvailable({ used: 9, limit: planCatalog.free.limits.memberSeats })).toBe(false);
  });
});
