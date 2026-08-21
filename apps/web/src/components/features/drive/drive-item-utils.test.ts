import { describe, expect, it } from "vitest";
import { isSelectionKey } from "./drive-item-utils";

describe("isSelectionKey", () => {
  it("accepts a well-formed file selection key", () => {
    expect(isSelectionKey("file:abc-123")).toBe(true);
  });

  it("accepts a well-formed folder selection key", () => {
    expect(isSelectionKey("folder:abc-123")).toBe(true);
  });

  it("rejects a key with an unknown kind", () => {
    expect(isSelectionKey("event:abc-123")).toBe(false);
  });

  it("rejects a key with no separator", () => {
    expect(isSelectionKey("abc-123")).toBe(false);
  });
});
