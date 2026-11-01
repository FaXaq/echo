import { describe, expect, it } from "vitest";
import { getUploadProgress, setUploadProgress, totalUploadRatio } from "./upload-progress.js";

describe("upload progress", () => {
  it("tracks progress per file, defaulting to 0", () => {
    const file = new File(["a"], "a.wav");

    expect(getUploadProgress(file)).toBe(0);
    setUploadProgress(file, 0.4);
    expect(getUploadProgress(file)).toBe(0.4);
  });

  it("weights the total by file size", () => {
    expect(
      totalUploadRatio([
        { sizeBytes: 900, ratio: 1 },
        { sizeBytes: 100, ratio: 0 },
      ]),
    ).toBe(0.9);
  });

  it("is 0 when there is nothing to upload", () => {
    expect(totalUploadRatio([])).toBe(0);
  });
});
