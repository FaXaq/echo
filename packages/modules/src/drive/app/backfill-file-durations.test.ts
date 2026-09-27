import { describe, expect, it } from "vitest";
import { makeFakeDb, makeFakeFileRecord, makeFakeS3Storage } from "./test-fixtures.js";
import { backfillFileDurations } from "./backfill-file-durations.js";
import type {
  FindFilesMissingDurationQueryPort,
  UpdateFileDurationByIdCommandPort,
  UpdateFileDurationByIdInput,
} from "../infrastructure/index.js";

function makeFakeFindFilesMissingDuration(
  files: ReturnType<typeof makeFakeFileRecord>[],
): FindFilesMissingDurationQueryPort {
  return async () => files;
}

function makeFakeUpdateFileDurationById(
  onUpdate?: (input: UpdateFileDurationByIdInput) => void,
): UpdateFileDurationByIdCommandPort {
  return async (_db, input) => {
    onUpdate?.(input);
  };
}

describe("backfillFileDurations", () => {
  it("updates duration for every file the query returns", async () => {
    const updated: UpdateFileDurationByIdInput[] = [];
    const files = [
      makeFakeFileRecord({ id: "file-1" }),
      makeFakeFileRecord({ id: "file-2", kind: "video", mimeType: "video/mp4" }),
    ];

    const result = await backfillFileDurations({
      db: makeFakeDb(),
      findFilesMissingDurationQuery: makeFakeFindFilesMissingDuration(files),
      updateFileDurationByIdCommand: makeFakeUpdateFileDurationById((input) => updated.push(input)),
      s3Storage: makeFakeS3Storage(),
      fetchBytes: async () => new Uint8Array(),
      parseDuration: async (_bytes, mimeType) => (mimeType === "audio/mpeg" ? 183 : 240),
    });

    expect(result).toEqual({ processed: 2, updated: 2, skipped: 0 });
    expect(updated).toEqual([
      { id: "file-1", durationSeconds: 183 },
      { id: "file-2", durationSeconds: 240 },
    ]);
  });

  it("skips a file without updating it when duration can't be determined", async () => {
    const updated: UpdateFileDurationByIdInput[] = [];
    const files = [makeFakeFileRecord({ id: "file-1" }), makeFakeFileRecord({ id: "file-2" })];
    let parseCalls = 0;

    const result = await backfillFileDurations({
      db: makeFakeDb(),
      findFilesMissingDurationQuery: makeFakeFindFilesMissingDuration(files),
      updateFileDurationByIdCommand: makeFakeUpdateFileDurationById((input) => updated.push(input)),
      s3Storage: makeFakeS3Storage(),
      fetchBytes: async () => new Uint8Array(),
      parseDuration: async () => (parseCalls++ === 0 ? null : 100),
    });

    expect(result).toEqual({ processed: 2, updated: 1, skipped: 1 });
    expect(updated).toEqual([{ id: "file-2", durationSeconds: 100 }]);
  });

  it("continues past a file whose byte fetch throws, skipping only that one", async () => {
    const updated: UpdateFileDurationByIdInput[] = [];
    const files = [
      makeFakeFileRecord({ id: "file-1", s3Key: "org/org-1/file-1/demo.mp3" }),
      makeFakeFileRecord({ id: "file-2", s3Key: "org/org-1/file-2/demo.mp3" }),
    ];

    const result = await backfillFileDurations({
      db: makeFakeDb(),
      findFilesMissingDurationQuery: makeFakeFindFilesMissingDuration(files),
      updateFileDurationByIdCommand: makeFakeUpdateFileDurationById((input) => updated.push(input)),
      s3Storage: makeFakeS3Storage(),
      fetchBytes: async (url) => {
        if (url.includes("file-1")) throw new Error("network error");
        return new Uint8Array();
      },
      parseDuration: async () => 100,
    });

    expect(result).toEqual({ processed: 2, updated: 1, skipped: 1 });
    expect(updated).toEqual([{ id: "file-2", durationSeconds: 100 }]);
  });
});
