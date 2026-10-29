import { describe, expect, it } from "vitest";
import { fileObjectKeys, kindForMimeType, mimeTypeForFile } from "./index.js";

describe("kindForMimeType", () => {
  it("maps known audio mime types to the audio kind", () => {
    expect(kindForMimeType("audio/mpeg")).toBe("audio");
    expect(kindForMimeType("audio/wav")).toBe("audio");
    expect(kindForMimeType("audio/x-wav")).toBe("audio");
    expect(kindForMimeType("audio/wave")).toBe("audio");
  });

  it("maps known video mime types to the video kind", () => {
    expect(kindForMimeType("video/mp4")).toBe("video");
  });

  it("maps known image mime types to the image kind", () => {
    expect(kindForMimeType("image/png")).toBe("image");
    expect(kindForMimeType("image/heic")).toBe("image");
    expect(kindForMimeType("image/avif")).toBe("image");
  });

  it("maps camera raw mime types to the image kind", () => {
    expect(kindForMimeType("image/x-canon-cr2")).toBe("image");
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

describe("mimeTypeForFile", () => {
  it("keeps a supported browser-reported type", () => {
    expect(mimeTypeForFile({ name: "photo.png", type: "image/png" })).toBe("image/png");
  });

  it("falls back to the extension for camera raw files", () => {
    expect(mimeTypeForFile({ name: "IMG_01.NEF", type: "" })).toBe("image/x-nikon-nef");
    expect(mimeTypeForFile({ name: "photo.dng", type: "image/dng" })).toBe("image/x-adobe-dng");
  });

  it("keeps an unknown type untouched", () => {
    expect(mimeTypeForFile({ name: "archive.zip", type: "application/zip" })).toBe(
      "application/zip",
    );
  });
});

describe("fileObjectKeys", () => {
  it("includes the extracted preview for camera raw files", () => {
    expect(fileObjectKeys({ s3Key: "org/1/a/photo.arw", mimeType: "image/x-sony-arw" })).toEqual([
      "org/1/a/photo.arw",
      "org/1/a/photo.arw.preview.jpg",
    ]);
  });

  it("only includes the original for other files", () => {
    expect(fileObjectKeys({ s3Key: "org/1/a/photo.png", mimeType: "image/png" })).toEqual([
      "org/1/a/photo.png",
    ]);
  });
});
