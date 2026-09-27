import type { FetchBytesPort } from "@echo/modules/drive/app";

export const fetchBytes: FetchBytesPort = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return new Uint8Array(await response.arrayBuffer());
};
