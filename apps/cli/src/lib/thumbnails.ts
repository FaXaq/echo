import { execFile } from "node:child_process";
import sharp from "sharp";
import type { CaptureVideoFramePort, PutBytesPort, ResizeImagePort } from "@echo/modules/drive/app";

const SHORTEST_SIDE = 480;
const FFMPEG_TIMEOUT_MS = 60_000;

export const resizeImage: ResizeImagePort = (bytes) =>
  sharp(bytes)
    .rotate()
    .flatten({ background: "#ffffff" })
    .resize({
      width: SHORTEST_SIDE,
      height: SHORTEST_SIDE,
      fit: "outside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toBuffer();

function grabFrame(url: string, seconds: number) {
  const args = [
    "-ss",
    String(seconds),
    "-i",
    url,
    "-frames:v",
    "1",
    "-f",
    "image2pipe",
    "-c:v",
    "mjpeg",
    "-q:v",
    "2",
    "pipe:1",
  ];
  return new Promise<Buffer>((resolve) => {
    execFile(
      "ffmpeg",
      args,
      { encoding: "buffer", timeout: FFMPEG_TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024 },
      (error, stdout) => resolve(error ? Buffer.alloc(0) : stdout),
    );
  });
}

// ffmpeg's own errors quote the full command, which includes the signed URL.
// Scaling happens in sharp: ffmpeg rejects -vf on tiled HEIC, which it decodes as a filter graph.
export const captureVideoFrame: CaptureVideoFramePort = async (url) => {
  const frame = await grabFrame(url, 1);
  const source = frame.length > 0 ? frame : await grabFrame(url, 0);
  if (source.length === 0) throw new Error("ffmpeg could not capture a frame");
  return resizeImage(source);
};

export const putBytes: PutBytesPort = async (url, bytes, contentType) => {
  const response = await fetch(url, {
    method: "PUT",
    body: Buffer.from(bytes),
    headers: { "Content-Type": contentType },
  });
  if (!response.ok) {
    throw new Error(`Failed to upload thumbnail: ${response.status} ${response.statusText}`);
  }
};
