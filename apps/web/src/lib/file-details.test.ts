import { afterEach, describe, expect, it, vi } from "vitest";
import { FileUnavailableError, readFileDetails, toPhotoDetails } from "./file-details";

describe("readFileDetails", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each(["image", "document"])("reports a missing %s as unavailable", async (kind) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<Error/>", { status: 404 })),
    );

    await expect(readFileDetails({ kind, url: "https://s3/missing" })).rejects.toBeInstanceOf(
      FileUnavailableError,
    );
  });
});

const tag = (value: unknown, description = String(value)) => ({ value, description });

describe("toPhotoDetails", () => {
  it("reads an iPhone photo's EXIF and GPS", () => {
    expect(
      toPhotoDetails({
        exif: {
          Make: tag(["Apple"], "Apple"),
          Model: tag(["iPhone 17"], "iPhone 17"),
          FNumber: tag([8, 5], "f/1.6"),
          ExposureTime: tag([1, 33], "1/33"),
          ISOSpeedRatings: tag(400),
          FocalLength: tag([6249513, 1048576], "5.96 mm"),
          DateTimeOriginal: tag(["2026:10:08 18:40:09"], "2026:10:08 18:40:09"),
          OffsetTimeOriginal: tag(["+02:00"], "+02:00"),
        },
        gps: { Latitude: 48.834652, Longitude: 2.377688 },
      }),
    ).toEqual({
      camera: "Apple iPhone 17",
      aperture: 1.6,
      exposureTime: 1 / 33,
      iso: 400,
      focalLength: 6,
      takenAt: new Date("2026-10-08T16:40:09Z"),
      latitude: 48.834652,
      longitude: 2.377688,
    });
  });

  it("does not repeat the make when the model already contains it", () => {
    expect(
      toPhotoDetails({ exif: { Make: tag("Canon"), Model: tag("Canon EOS R6") } }).camera,
    ).toBe("Canon EOS R6");
  });

  it("leaves every field empty when the file has no metadata", () => {
    expect(Object.values(toPhotoDetails({})).every((value) => value === null)).toBe(true);
  });
});
