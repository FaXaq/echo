import { parseBuffer } from "music-metadata";
import type { ParseDurationPort } from "@echo/modules/drive/app";

export const parseDuration: ParseDurationPort = async (bytes, mimeType) => {
  const { format } = await parseBuffer(bytes, { mimeType });
  if (format.duration === undefined) return null;
  return Math.round(format.duration);
};
