import { describe, expect, it } from "vitest";
import { AppError, QuotaExceededError, quotaExceeded } from "./index.js";

describe("quotaExceeded", () => {
  it("builds an AppError carrying the limit metadata", () => {
    const error = quotaExceeded({ limitName: "storageBytes", limit: 1000, current: 950 });

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(QuotaExceededError);
    expect(error.type).toBe("QUOTA_EXCEEDED");
    expect(error.limitName).toBe("storageBytes");
    expect(error.limit).toBe(1000);
    expect(error.current).toBe(950);
  });
});
