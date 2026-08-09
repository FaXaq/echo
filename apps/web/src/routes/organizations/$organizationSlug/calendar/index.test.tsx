import { describe, expect, it } from "vitest";

import { Route } from "./index";

describe("/organizations/$organizationSlug/calendar validateSearch", () => {
  it("falls back to undefined when date is not a string (e.g. a JSON-parsed number)", () => {
    const validateSearch = Route.options.validateSearch;
    if (!validateSearch || !("safeParse" in validateSearch)) {
      throw new Error("expected a zod validateSearch schema");
    }
    const result = validateSearch.safeParse({ date: 2026 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date).toBeUndefined();
    }
  });
});
