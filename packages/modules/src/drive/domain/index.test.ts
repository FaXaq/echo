import { describe, expect, it } from "vitest";
import { kindForMimeType } from "./index.js";

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
