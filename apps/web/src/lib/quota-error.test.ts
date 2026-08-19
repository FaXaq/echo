import { describe, expect, it } from "vitest";
import { getQuotaError } from "./quota-error";

describe("getQuotaError", () => {
  it("extracts quota metadata from a tRPC client error", () => {
    const error = Object.assign(new Error("Quota exceeded: storageBytes"), {
      data: { quota: { limitName: "storageBytes", limit: 1000, current: 950 } },
    });

    expect(getQuotaError(error)).toEqual({
      limitName: "storageBytes",
      limit: 1000,
      current: 950,
    });
  });

  it("returns null for an ordinary error", () => {
    expect(getQuotaError(new Error("Upload failed"))).toBeNull();
  });

  it("returns null for a non-error value", () => {
    expect(getQuotaError("nope")).toBeNull();
  });
});
