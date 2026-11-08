import { describe, expect, it, vi } from "vitest";
import { makeFakeDb, makeFakeFileRecord, makeFakeS3Storage } from "./test-fixtures.js";
import { backfillFileThumbnails } from "./backfill-file-thumbnails.js";

type Deps = Parameters<typeof backfillFileThumbnails>[0];

const image = makeFakeFileRecord({
  id: "image-1",
  kind: "image",
  mimeType: "image/png",
  s3Key: "o/a/photo.png",
  status: "uploaded",
});
const video = makeFakeFileRecord({
  id: "video-1",
  kind: "video",
  mimeType: "video/mp4",
  s3Key: "o/a/clip.mp4",
  status: "uploaded",
});
const raw = makeFakeFileRecord({
  id: "raw-1",
  kind: "image",
  mimeType: "image/x-sony-arw",
  s3Key: "o/a/shot.arw",
  status: "uploaded",
});

function setup(files: Awaited<ReturnType<Deps["findFilesMissingThumbnailQuery"]>>) {
  const marked: string[] = [];
  const puts: { url: string; contentType: string }[] = [];
  const deps: Deps = {
    db: makeFakeDb(),
    findFilesMissingThumbnailQuery: async () => files,
    markFileHasThumbnailCommand: async (_db, { id }) => {
      marked.push(id);
    },
    s3Storage: makeFakeS3Storage(),
    fetchBytes: vi.fn(async () => new Uint8Array([1])),
    resizeImage: async () => new Uint8Array([2]),
    captureVideoFrame: vi.fn(async () => new Uint8Array([3])),
    putBytes: async (url, _bytes, contentType) => {
      puts.push({ url, contentType });
    },
  };
  return { deps, marked, puts };
}

describe("backfillFileThumbnails", () => {
  it("resizes images and marks them", async () => {
    const { deps, marked, puts } = setup([image]);

    const result = await backfillFileThumbnails(deps);

    expect(result).toEqual({ processed: 1, updated: 1, skipped: 0 });
    expect(puts).toEqual([
      { url: "https://fake-s3.local/o/a/photo.png.thumbnail.jpg", contentType: "image/jpeg" },
    ]);
    expect(marked).toEqual(["image-1"]);
  });

  it("captures a frame for videos without downloading them", async () => {
    const { deps, marked } = setup([video]);

    await backfillFileThumbnails(deps);

    expect(deps.fetchBytes).not.toHaveBeenCalled();
    expect(deps.captureVideoFrame).toHaveBeenCalledWith(
      "https://fake-s3.local/o/a/clip.mp4?download",
    );
    expect(marked).toEqual(["video-1"]);
  });

  it("captures a frame for HEIC files", async () => {
    const heic = makeFakeFileRecord({
      id: "heic-1",
      kind: "image",
      mimeType: "image/heic",
      s3Key: "o/a/shot.heic",
      status: "uploaded",
    });
    const { deps, marked } = setup([heic]);

    await backfillFileThumbnails(deps);

    expect(deps.fetchBytes).not.toHaveBeenCalled();
    expect(deps.captureVideoFrame).toHaveBeenCalledWith(
      "https://fake-s3.local/o/a/shot.heic?download",
    );
    expect(marked).toEqual(["heic-1"]);
  });

  it("reads the extracted preview for camera raw files", async () => {
    const { deps } = setup([raw]);

    await backfillFileThumbnails(deps);

    expect(deps.fetchBytes).toHaveBeenCalledWith(
      "https://fake-s3.local/o/a/shot.arw.preview.jpg?download",
    );
  });

  it("skips and does not mark a file when generation fails", async () => {
    const { deps, marked } = setup([image, video]);
    const onSkip = vi.fn();
    const failure = new Error("corrupt");

    const result = await backfillFileThumbnails({
      ...deps,
      resizeImage: async () => {
        throw failure;
      },
      onSkip,
    });

    expect(result).toEqual({ processed: 2, updated: 1, skipped: 1 });
    expect(marked).toEqual(["video-1"]);
    expect(onSkip).toHaveBeenCalledWith(image, failure);
  });

  it("does not mark a file when the upload fails", async () => {
    const { deps, marked } = setup([image]);

    const result = await backfillFileThumbnails({
      ...deps,
      putBytes: async () => {
        throw new Error("upload failed");
      },
    });

    expect(result).toEqual({ processed: 1, updated: 0, skipped: 1 });
    expect(marked).toEqual([]);
  });
});
