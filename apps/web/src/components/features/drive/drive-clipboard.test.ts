import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { copyFiles, useDriveClipboard } from "./drive-clipboard";

describe("drive clipboard", () => {
  afterEach(() => {
    renderHook(() => useDriveClipboard("org-1")).result.current.clear();
    renderHook(() => useDriveClipboard("org-2")).result.current.clear();
  });

  it("starts empty", () => {
    const { result } = renderHook(() => useDriveClipboard("org-1"));

    expect(result.current.fileIds).toEqual([]);
  });

  it("holds copied file ids and notifies subscribers", () => {
    const { result } = renderHook(() => useDriveClipboard("org-1"));

    act(() => copyFiles("org-1", ["a", "b"]));

    expect(result.current.fileIds).toEqual(["a", "b"]);
  });

  it("is scoped per organization", () => {
    const other = renderHook(() => useDriveClipboard("org-2"));

    act(() => copyFiles("org-1", ["a"]));

    expect(other.result.current.fileIds).toEqual([]);
  });

  it("clears", () => {
    const { result } = renderHook(() => useDriveClipboard("org-1"));
    act(() => copyFiles("org-1", ["a"]));

    act(() => result.current.clear());

    expect(result.current.fileIds).toEqual([]);
  });
});
