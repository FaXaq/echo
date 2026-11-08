import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createThumbnail,
  fileTypeLabel,
  findEmbeddedJpegs,
  formatDuration,
  getMediaMetadata,
  thumbnailDimensions,
} from "./file.js";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("thumbnailDimensions", () => {
  it("scales the shortest side to 480", () => {
    expect(thumbnailDimensions(4000, 3000)).toEqual({ width: 640, height: 480 });
    expect(thumbnailDimensions(1080, 1920)).toEqual({ width: 480, height: 853 });
  });

  it("never enlarges", () => {
    expect(thumbnailDimensions(300, 200)).toEqual({ width: 300, height: 200 });
  });
});

describe("createThumbnail", () => {
  function startImageThumbnail() {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const createElement = vi.spyOn(document, "createElement");
    const file = new File(["x"], "a.png", { type: "image/png" });
    const promise = createThumbnail(file, "image/png", null);
    const image = () =>
      findCreatedElement(
        createElement,
        (v): v is HTMLImageElement => v instanceof HTMLImageElement,
      );
    return { promise, image };
  }

  it("returns null for audio", async () => {
    const file = new File(["x"], "a.mp3", { type: "audio/mpeg" });

    await expect(createThumbnail(file, "audio/mpeg", null)).resolves.toBeNull();
  });

  it("returns null for a raw file with no extracted preview", async () => {
    const file = new File(["x"], "a.arw", { type: "image/x-sony-arw" });

    await expect(createThumbnail(file, "image/x-sony-arw", null)).resolves.toBeNull();
  });

  it("returns null when the image can't be decoded", async () => {
    const { promise, image } = startImageThumbnail();
    const element = await vi.waitFor(image);

    element.dispatchEvent(new Event("error"));

    await expect(promise).resolves.toBeNull();
  });

  it("returns null when an image reports no size", async () => {
    const { promise, image } = startImageThumbnail();
    const element = await vi.waitFor(image);

    element.dispatchEvent(new Event("load"));

    await expect(promise).resolves.toBeNull();
  });

  it("returns null when a video can't be decoded", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const createElement = vi.spyOn(document, "createElement");
    const file = new File(["x"], "a.mov", { type: "video/quicktime" });
    const promise = createThumbnail(file, "video/quicktime", null);
    const video = await vi.waitFor(() =>
      findCreatedElement(
        createElement,
        (v): v is HTMLVideoElement => v instanceof HTMLVideoElement,
      ),
    );

    video.dispatchEvent(new Event("error"));

    await expect(promise).resolves.toBeNull();
  });

  it("returns null when decoding hangs past the timeout", async () => {
    vi.useFakeTimers();
    const { promise } = startImageThumbnail();

    await vi.advanceTimersByTimeAsync(15_000);

    await expect(promise).resolves.toBeNull();
  });
});

describe("fileTypeLabel", () => {
  it.each([
    ["setlist.pdf", "PDF"],
    ["paroles.v4.docx", "DOCX"],
    ["project.torrent", "TORR"],
    ["README", "FILE"],
    [".env", "FILE"],
    ["trailing.", "FILE"],
  ])("labels %s as %s", (filename, label) => {
    expect(fileTypeLabel(filename)).toBe(label);
  });
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

describe("getMediaMetadata", () => {
  it("resolves null for a file whose kind isn't audio or video, without touching the DOM", async () => {
    const createObjectURL = vi.spyOn(URL, "createObjectURL");

    const result = await getMediaMetadata(makeFile("setlist.pdf", "application/pdf"));

    expect(result).toEqual({ durationSeconds: null, width: null, height: null });
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("resolves the rounded duration once the audio element reports it", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake-url");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const createElement = vi.spyOn(document, "createElement");

    const promise = getMediaMetadata(makeFile("song.mp3", "audio/mpeg"));
    const audioEl = findCreatedElement(
      createElement,
      (v): v is HTMLAudioElement => v instanceof HTMLAudioElement,
    );
    Object.defineProperty(audioEl, "duration", { value: 182.6, configurable: true });
    audioEl.dispatchEvent(new Event("loadedmetadata"));

    await expect(promise).resolves.toEqual({ durationSeconds: 183, width: null, height: null });
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
  });

  it("resolves null when the media element fails to decode the file", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake-url");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const createElement = vi.spyOn(document, "createElement");

    const promise = getMediaMetadata(makeFile("broken.mp3", "audio/mpeg"));
    const audioEl = findCreatedElement(
      createElement,
      (v): v is HTMLAudioElement => v instanceof HTMLAudioElement,
    );
    audioEl.dispatchEvent(new Event("error"));

    await expect(promise).resolves.toEqual({ durationSeconds: null, width: null, height: null });
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
  });

  it("gives up with empty metadata when the browser never reports any", async () => {
    vi.useFakeTimers();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const promise = getMediaMetadata(makeFile("clip.mov", "video/quicktime"));
    await vi.advanceTimersByTimeAsync(15_000);

    await expect(promise).resolves.toEqual({ durationSeconds: null, width: null, height: null });
    vi.useRealTimers();
  });

  it("lets the browser sniff a video's bytes instead of declaring its type", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const createElement = vi.spyOn(document, "createElement");

    const promise = getMediaMetadata(makeFile("clip.mp4", "video/mp4"));
    const videoEl = findCreatedElement(
      createElement,
      (v): v is HTMLVideoElement => v instanceof HTMLVideoElement,
    );
    Object.defineProperty(videoEl, "duration", { value: 60, configurable: true });
    Object.defineProperty(videoEl, "videoWidth", { value: 1920, configurable: true });
    Object.defineProperty(videoEl, "videoHeight", { value: 1080, configurable: true });
    videoEl.dispatchEvent(new Event("loadedmetadata"));

    await expect(promise).resolves.toEqual({ durationSeconds: 60, width: 1920, height: 1080 });
    expect(videoEl.querySelector("source")).toBeNull();
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
