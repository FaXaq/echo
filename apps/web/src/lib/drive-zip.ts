import { zipSync, type Zippable } from "fflate";

export const DRIVE_BULK_DOWNLOAD_MAX_FILES = 100;
export const DRIVE_BULK_DOWNLOAD_MAX_BYTES = 300 * 1024 * 1024;

export function isWithinBulkDownloadLimit(files: { sizeBytes: number }[]) {
  if (files.length === 0 || files.length > DRIVE_BULK_DOWNLOAD_MAX_FILES) return false;
  const totalBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0);
  return totalBytes <= DRIVE_BULK_DOWNLOAD_MAX_BYTES;
}

export function buildDriveZipFilename({
  folderName,
  organizationName,
  date,
}: {
  folderName: string | null;
  organizationName: string;
  date: Date;
}) {
  const isoDate = date.toISOString().slice(0, 10);
  const base = folderName ?? `${organizationName}-drive`;
  return `${base}-${isoDate}.zip`;
}

export interface DriveZipEntry {
  filename: string;
  url: string;
}

export interface BuildDriveZipResult {
  blob: Blob;
  skipped: string[];
}

export async function buildDriveZip(
  entries: DriveZipEntry[],
  fetchImpl: typeof fetch = fetch,
): Promise<BuildDriveZipResult> {
  const results = await Promise.allSettled(
    entries.map(async (entry) => {
      const response = await fetchImpl(entry.url);
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const buffer = await response.arrayBuffer();
      return { filename: entry.filename, data: new Uint8Array(buffer) };
    }),
  );

  const zippable: Zippable = {};
  const skipped: string[] = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      zippable[result.value.filename] = result.value.data;
    } else {
      skipped.push(entries[index].filename);
    }
  });

  const zipped = zipSync(zippable);
  return { blob: new Blob([zipped], { type: "application/zip" }), skipped };
}
