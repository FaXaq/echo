import type { RouterOutputs } from "@echo/api/router";
import { apiClient } from "@/services/api-client";

export type Place = RouterOutputs["place"]["searchPlaces"][number];

export async function searchPlaces(
  query: string,
  opts: { signal?: AbortSignal } = {},
): Promise<Place[]> {
  return apiClient.place.searchPlaces.query({ query }, { signal: opts.signal });
}
