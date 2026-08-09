import { describe, expect, it } from "vitest";
import { isValidFileSize, kindForMimeType, MAX_FILE_SIZE_BYTES } from "./index.js";

describe("kindForMimeType", () => {
  it("maps known audio mime types to the audio kind", () => {
    expect(kindForMimeType("audio/mpeg")).toBe("audio");
  });

  it("maps known video mime types to the video kind", () => {
    expect(kindForMimeType("video/mp4")).toBe("video");
  });

  it("maps known image mime types to the image kind", () => {
    expect(kindForMimeType("image/png")).toBe("image");
  });

  it("maps known document mime types to the document kind", () => {
    expect(kindForMimeType("application/pdf")).toBe("document");
    expect(kindForMimeType("application/msword")).toBe("document");
    expect(
      kindForMimeType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    ).toBe("document");
  });

  it("returns null for an unsupported mime type", () => {
    expect(kindForMimeType("application/zip")).toBeNull();
  });
});

describe("isValidFileSize", () => {
  it("accepts a size within the limit", () => {
    expect(isValidFileSize(1024)).toBe(true);
  });

  it("accepts a size exactly at the limit", () => {
    expect(isValidFileSize(MAX_FILE_SIZE_BYTES)).toBe(true);
  });

  it("rejects a size over the limit", () => {
    expect(isValidFileSize(MAX_FILE_SIZE_BYTES + 1)).toBe(false);
  });

  it("rejects a zero or negative size", () => {
    expect(isValidFileSize(0)).toBe(false);
    expect(isValidFileSize(-1)).toBe(false);
  });
});
