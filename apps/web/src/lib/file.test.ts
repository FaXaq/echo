import { afterEach, describe, expect, it, vi } from "vitest";
import { findEmbeddedJpegs, formatDuration, getMediaDuration } from "./file.js";

afterEach(() => {
  vi.restoreAllMocks();
});

function makeFile(name: string, type: string): File {
  return new File(["fake-bytes"], name, { type });
}

describe("formatDuration", () => {
  it("formats sub-hour durations as mm:ss", () => {
    expect(formatDuration(65)).toBe("1:05");
  });

  it("formats durations of an hour or more as h:mm:ss", () => {
    expect(formatDuration(3725)).toBe("1:02:05");
  });

  it("falls back to 0:00 for negative or non-finite input", () => {
    expect(formatDuration(-5)).toBe("0:00");
    expect(formatDuration(Number.NaN)).toBe("0:00");
  });
});

function findCreatedElement<T extends Element>(
  createElement: ReturnType<typeof vi.spyOn>,
  isInstance: (value: unknown) => value is T,
): T {
  const element = createElement.mock.results
    .map((r: { value: unknown }) => r.value)
    .find(isInstance);
  if (!element) throw new Error("Expected element was not created");
  return element;
}

describe("getMediaDuration", () => {
  it("resolves null for a file whose kind isn't audio or video, without touching the DOM", async () => {
    const createObjectURL = vi.spyOn(URL, "createObjectURL");

    const result = await getMediaDuration(makeFile("setlist.pdf", "application/pdf"));

    expect(result).toBeNull();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("resolves the rounded duration once the audio element reports it", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake-url");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const createElement = vi.spyOn(document, "createElement");

    const promise = getMediaDuration(makeFile("song.mp3", "audio/mpeg"));
    const audioEl = findCreatedElement(
      createElement,
      (v): v is HTMLAudioElement => v instanceof HTMLAudioElement,
    );
    Object.defineProperty(audioEl, "duration", { value: 182.6, configurable: true });
    audioEl.dispatchEvent(new Event("loadedmetadata"));

    await expect(promise).resolves.toBe(183);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
  });

  it("resolves null when the media element fails to decode the file", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake-url");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const createElement = vi.spyOn(document, "createElement");

    const promise = getMediaDuration(makeFile("broken.mp3", "audio/mpeg"));
    const audioEl = findCreatedElement(
      createElement,
      (v): v is HTMLAudioElement => v instanceof HTMLAudioElement,
    );
    audioEl.dispatchEvent(new Event("error"));

    await expect(promise).resolves.toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
  });

  it("creates a <video> element with a typed <source> for a video file", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const createElement = vi.spyOn(document, "createElement");

    const promise = getMediaDuration(makeFile("clip.mp4", "video/mp4"));
    const videoEl = findCreatedElement(
      createElement,
      (v): v is HTMLVideoElement => v instanceof HTMLVideoElement,
    );
    Object.defineProperty(videoEl, "duration", { value: 60, configurable: true });
    videoEl.dispatchEvent(new Event("loadedmetadata"));

    await expect(promise).resolves.toBe(60);
    expect(videoEl.querySelector("source")?.getAttribute("type")).toBe("video/mp4");
  });
});

describe("findEmbeddedJpegs", () => {
  const scan = [0xff, 0xda, 0x00, 0x04, 0x01, 0x02, 0x11, 0xff, 0x00, 0x22, 0xff, 0xd9];
  const thumbnail = [0xff, 0xd8, ...scan];
  const preview = [0xff, 0xd8, 0xff, 0xe1, 0x00, thumbnail.length + 2, ...thumbnail, ...scan];

  it("finds the outer jpeg without splitting on the exif thumbnail it embeds", () => {
    const bytes = new Uint8Array([0x49, 0x49, 0xff, 0xd8, 0x00, ...preview, 0xff, 0xd9, 0x07]);

    expect(findEmbeddedJpegs(bytes).map((jpeg) => [...jpeg])).toEqual([preview]);
  });

  it("falls back to the exif thumbnail when the outer jpeg is cut off", () => {
    const bytes = new Uint8Array(preview.slice(0, -2));

    expect(findEmbeddedJpegs(bytes).map((jpeg) => [...jpeg])).toEqual([thumbnail]);
  });
});
