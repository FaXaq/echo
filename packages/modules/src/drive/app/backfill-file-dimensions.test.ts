import { describe, expect, it, vi } from "vitest";
import { makeFakeDb, makeFakeFileRecord, makeFakeS3Storage } from "./test-fixtures.js";
import { backfillFileDimensions } from "./backfill-file-dimensions.js";

type Deps = Parameters<typeof backfillFileDimensions>[0];

const photo = makeFakeFileRecord({
  id: "photo-1",
  kind: "image",
  mimeType: "image/png",
  s3Key: "o/a/photo.png",
  status: "uploaded",
});
const broken = makeFakeFileRecord({ ...photo, id: "broken-1", s3Key: "o/a/broken.png" });

function setup(overrides: Partial<Deps> = {}) {
  const updates: { id: string; width: number; height: number }[] = [];
  const deps: Deps = {
    db: makeFakeDb(),
    findFilesMissingDimensionsQuery: async () => [photo],
    updateFileDimensionsByIdCommand: async (_db, input) => {
      updates.push(input);
    },
    s3Storage: makeFakeS3Storage(),
    fetchBytes: vi.fn(async () => new Uint8Array([1])),
    readImageSize: async () => ({ width: 720, height: 480 }),
    ...overrides,
  };
  return { deps, updates };
}

describe("backfillFileDimensions", () => {
  it("records the size read from the thumbnail, not the original", async () => {
    const { deps, updates } = setup();

    const result = await backfillFileDimensions(deps);

    expect(result).toEqual({ processed: 1, updated: 1, skipped: 0 });
    expect(deps.fetchBytes).toHaveBeenCalledWith(
      "https://fake-s3.local/o/a/photo.png.thumbnail.jpg?download",
    );
    expect(updates).toEqual([{ id: "photo-1", width: 720, height: 480 }]);
  });

  it("skips a file that fails and continues with the rest", async () => {
    const onSkip = vi.fn();
    const { deps, updates } = setup({
      findFilesMissingDimensionsQuery: async () => [broken, photo],
      fetchBytes: async (url) => {
        if (url.includes("broken")) throw new Error("gone");
        return new Uint8Array([1]);
      },
      onSkip,
    });

    const result = await backfillFileDimensions(deps);

    expect(result).toEqual({ processed: 2, updated: 1, skipped: 1 });
    expect(onSkip).toHaveBeenCalledWith(broken, expect.any(Error));
    expect(updates.map((update) => update.id)).toEqual(["photo-1"]);
  });
});
