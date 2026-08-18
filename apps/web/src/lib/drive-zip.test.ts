import { describe, expect, it } from "vitest";
import {
  DRIVE_BULK_DOWNLOAD_MAX_BYTES,
  DRIVE_BULK_DOWNLOAD_MAX_FILES,
  buildDriveZip,
  buildDriveZipFilename,
  isWithinBulkDownloadLimit,
} from "./drive-zip";

describe("isWithinBulkDownloadLimit", () => {
  it("rejects an empty selection", () => {
    expect(isWithinBulkDownloadLimit([])).toBe(false);
  });

  it("accepts a selection under both limits", () => {
    expect(isWithinBulkDownloadLimit([{ sizeBytes: 1024 }, { sizeBytes: 2048 }])).toBe(true);
  });

  it("rejects a selection over the file count limit", () => {
    const files = Array.from({ length: DRIVE_BULK_DOWNLOAD_MAX_FILES + 1 }, () => ({
      sizeBytes: 1,
    }));
    expect(isWithinBulkDownloadLimit(files)).toBe(false);
  });

  it("rejects a selection over the total size limit", () => {
    expect(isWithinBulkDownloadLimit([{ sizeBytes: DRIVE_BULK_DOWNLOAD_MAX_BYTES + 1 }])).toBe(
      false,
    );
  });
});

describe("buildDriveZipFilename", () => {
  const date = new Date("2026-08-17T10:00:00Z");

  it("uses the folder name when inside a folder", () => {
    expect(
      buildDriveZipFilename({ folderName: "Demos", organizationName: "The Beatles", date }),
    ).toBe("Demos-2026-08-17.zip");
  });

  it("falls back to the organization name at Drive root", () => {
    expect(buildDriveZipFilename({ folderName: null, organizationName: "The Beatles", date })).toBe(
      "The Beatles-drive-2026-08-17.zip",
    );
  });
});

describe("buildDriveZip", () => {
  function fakeFetch(responses: Record<string, { ok: boolean; body?: string }>) {
    return async (input: RequestInfo | URL) => {
      const url = String(input);
      const response = responses[url];
      if (!response) throw new Error(`Unexpected URL: ${url}`);
      return {
        ok: response.ok,
        status: response.ok ? 200 : 500,
        arrayBuffer: async () => new TextEncoder().encode(response.body ?? "").buffer,
      } as Response;
    };
  }

  it("zips every entry that resolves successfully", async () => {
    const fetchImpl = fakeFetch({
      "https://example.com/a": { ok: true, body: "hello" },
      "https://example.com/b": { ok: true, body: "world" },
    });

    const result = await buildDriveZip(
      [
        { filename: "a.txt", url: "https://example.com/a" },
        { filename: "b.txt", url: "https://example.com/b" },
      ],
      fetchImpl,
    );

    expect(result.skipped).toEqual([]);
    expect(result.blob.type).toBe("application/zip");
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it("skips entries that fail to fetch and keeps the rest", async () => {
    const fetchImpl = fakeFetch({
      "https://example.com/a": { ok: true, body: "hello" },
      "https://example.com/b": { ok: false },
    });

    const result = await buildDriveZip(
      [
        { filename: "a.txt", url: "https://example.com/a" },
        { filename: "b.txt", url: "https://example.com/b" },
      ],
      fetchImpl,
    );

    expect(result.skipped).toEqual(["b.txt"]);
    expect(result.blob.size).toBeGreaterThan(0);
  });
});
