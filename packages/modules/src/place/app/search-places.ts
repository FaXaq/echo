import type { GeocodingPort } from "@echo/adapters/geocoding";
import type { Place } from "../domain/index.js";

export async function searchPlaces(
  deps: { geocoding: GeocodingPort },
  input: { query: string },
): Promise<Place[]> {
  return deps.geocoding.searchPlaces(input.query);
}
