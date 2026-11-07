import { readMediaMetadata } from "@/lib/file";

export type PhotoDetails = {
  camera: string | null;
  aperture: number | null;
  exposureTime: number | null;
  iso: number | null;
  focalLength: number | null;
  takenAt: Date | null;
  latitude: number | null;
  longitude: number | null;
};

export type FileDetails = {
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  photo: PhotoDetails | null;
};

type Tag = { value: unknown; description: string } | undefined;
type ExifKey =
  | "Make"
  | "Model"
  | "FNumber"
  | "ExposureTime"
  | "ISOSpeedRatings"
  | "FocalLength"
  | "DateTimeOriginal"
  | "OffsetTimeOriginal"
  | "PixelXDimension"
  | "PixelYDimension";

export type MetadataTags = {
  exif?: Partial<Record<ExifKey, Tag>>;
  gps?: { Latitude?: number; Longitude?: number };
  file?: { "Image Width"?: Tag; "Image Height"?: Tag };
};

const finite = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const numberOf = (tag: Tag) => finite(Array.isArray(tag?.value) ? tag.value[0] : tag?.value);

const rationalOf = (tag: Tag) => {
  const value = tag?.value;
  if (!Array.isArray(value)) return finite(value);
  const [numerator, denominator] = value;
  return finite(numerator) !== null && finite(denominator) ? numerator / denominator : null;
};

const textOf = (tag: Tag) => tag?.description.trim() || null;

function dateOf(dateTag: Tag, offsetTag: Tag) {
  const match = textOf(dateTag)?.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}:\d{2}:\d{2})/);
  if (!match) return null;
  const [, year, month, day, time] = match;
  const date = new Date(`${year}-${month}-${day}T${time}${textOf(offsetTag) ?? ""}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toPhotoDetails(tags: MetadataTags): PhotoDetails {
  const exif = tags.exif ?? {};
  const make = textOf(exif.Make);
  const model = textOf(exif.Model);
  const focalLength = rationalOf(exif.FocalLength);
  return {
    camera: model && make && !model.startsWith(make) ? `${make} ${model}` : (model ?? make),
    aperture: rationalOf(exif.FNumber),
    exposureTime: rationalOf(exif.ExposureTime),
    iso: numberOf(exif.ISOSpeedRatings),
    focalLength: focalLength === null ? null : Math.round(focalLength * 10) / 10,
    takenAt: dateOf(exif.DateTimeOriginal, exif.OffsetTimeOriginal),
    latitude: finite(tags.gps?.Latitude),
    longitude: finite(tags.gps?.Longitude),
  };
}

function readBlobImageSize(blob: Blob) {
  const url = URL.createObjectURL(blob);
  return new Promise<{ width: number | null; height: number | null }>((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({ width: null, height: null });
    image.src = url;
  }).finally(() => URL.revokeObjectURL(url));
}

async function readImageDetails(url: string): Promise<FileDetails> {
  const [ExifReader, blob] = await Promise.all([
    import("exifreader"),
    fetchAvailable(url).then((response) => response.blob()),
  ]);
  let tags: MetadataTags = {};
  try {
    tags = ExifReader.load(await blob.arrayBuffer(), { expanded: true });
  } catch {
    // No readable metadata: fall back to decoding the image for its size.
  }
  const width = numberOf(tags.file?.["Image Width"]) ?? numberOf(tags.exif?.PixelXDimension);
  const height = numberOf(tags.file?.["Image Height"]) ?? numberOf(tags.exif?.PixelYDimension);
  const size = width && height ? { width, height } : await readBlobImageSize(blob);
  return { ...size, durationSeconds: null, photo: toPhotoDetails(tags) };
}

export class FileUnavailableError extends Error {
  constructor(status: number | null) {
    super(status === null ? "File couldn't be reached" : `File couldn't be loaded (${status})`);
    this.name = "FileUnavailableError";
  }
}

async function fetchAvailable(url: string, init?: RequestInit) {
  const response = await fetch(url, init).catch(() => {
    throw new FileUnavailableError(null);
  });
  if (!response.ok) throw new FileUnavailableError(response.status);
  return response;
}

// Downloads one byte: enough to learn whether storage still has the file.
export async function assertFileAvailable(url: string) {
  const response = await fetchAvailable(url, { headers: { Range: "bytes=0-0" } });
  await response.body?.cancel();
}

export async function readFileDetails(file: {
  kind: string | null;
  url: string;
}): Promise<FileDetails> {
  if (file.kind === "image") return readImageDetails(file.url);
  await assertFileAvailable(file.url);
  if (file.kind === "audio" || file.kind === "video") {
    return { ...(await readMediaMetadata(file.url, file.kind)), photo: null };
  }
  return { width: null, height: null, durationSeconds: null, photo: null };
}
