import { describe, expect, it } from "vitest";
import { evaluateOsFileDrop } from "./drive-drop";

describe("evaluateOsFileDrop", () => {
  it("rejects a drop with no entries", () => {
    expect(evaluateOsFileDrop([])).toEqual({ accepted: false, reason: "no-files" });
  });

  it("rejects a drop mixing files and a directory", () => {
    const entries = [
      { isFile: true, isDirectory: false },
      { isFile: false, isDirectory: true },
    ];
    expect(evaluateOsFileDrop(entries)).toEqual({
      accepted: false,
      reason: "contains-directory",
    });
  });

  it("rejects a drop of a single directory", () => {
    expect(evaluateOsFileDrop([{ isFile: false, isDirectory: true }])).toEqual({
      accepted: false,
      reason: "contains-directory",
    });
  });

  it("accepts a drop of one or more files", () => {
    const entries = [
      { isFile: true, isDirectory: false },
      { isFile: true, isDirectory: false },
    ];
    expect(evaluateOsFileDrop(entries)).toEqual({ accepted: true });
  });
});
