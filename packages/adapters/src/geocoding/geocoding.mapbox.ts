import { unknownError } from "@echo/errors";
import type { GeocodedPlace, GeocodingPort } from "./geocoding.port.js";

type MapboxForwardGeocodeResponse = {
  features: {
    properties: {
      name: string;
      full_address?: string;
      place_formatted?: string;
    };
    geometry: {
      coordinates: [number, number];
    };
  }[];
};

export function makeGeocoding(config: { accessToken: string }): GeocodingPort {
  return {
    searchPlaces: async (query): Promise<GeocodedPlace[]> => {
      const trimmed = query.trim();
      if (!trimmed) return [];

      const url = new URL("https://api.mapbox.com/search/searchbox/v1/forward");
      url.searchParams.set("q", trimmed);
      url.searchParams.set("access_token", config.accessToken);
      url.searchParams.set("limit", "10");
      url.searchParams.set("language", "en");
      url.searchParams.set(
        "types",
        "postcode,locality,place,neighborhood,address,poi,street,category",
      );

      let response: Response;
      try {
        response = await fetch(url);
      } catch (err) {
        throw unknownError(
          `Mapbox geocoding request failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      if (!response.ok) {
        throw unknownError(`Mapbox geocoding request failed with status ${response.status}`);
      }

      const body = (await response.json()) as MapboxForwardGeocodeResponse;

      return body.features.map((feature) => ({
        name: feature.properties.name,
        address:
          feature.properties.full_address ??
          feature.properties.place_formatted ??
          feature.properties.name,
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
      }));
    },
  };
}
