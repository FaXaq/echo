import { describe, expect, it } from "vitest";
import { evaluateOsFileDrop, resolveDropTargetFolderId } from "./drive-drop";

describe("resolveDropTargetFolderId", () => {
  it("targets the hovered folder when one is hovered", () => {
    expect(
      resolveDropTargetFolderId({ hoveredFolderId: "folder-1", currentFolderId: "folder-2" }),
    ).toBe("folder-1");
  });

  it("falls back to the current folder when nothing is hovered", () => {
    expect(resolveDropTargetFolderId({ hoveredFolderId: null, currentFolderId: "folder-2" })).toBe(
      "folder-2",
    );
  });

  it("falls back to Drive root when nothing is hovered and there is no current folder", () => {
    expect(resolveDropTargetFolderId({ hoveredFolderId: null, currentFolderId: null })).toBe(null);
  });
});

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
