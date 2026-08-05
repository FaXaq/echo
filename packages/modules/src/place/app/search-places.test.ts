import { describe, expect, it } from "vitest";
import type { GeocodedPlace, GeocodingPort } from "@echo/adapters/geocoding";
import { searchPlaces } from "./search-places.js";

function makeFakeGeocoding(results: GeocodedPlace[]): GeocodingPort {
  return {
    searchPlaces: async () => results,
  };
}

describe("searchPlaces", () => {
  it("delegates to the geocoding port and returns its results", async () => {
    const places: GeocodedPlace[] = [
      {
        name: "Le Duplex",
        address: "42 rue de la République, 69002 Lyon, France",
        lat: 45.764,
        lng: 4.8357,
      },
    ];

    const result = await searchPlaces(
      { geocoding: makeFakeGeocoding(places) },
      { query: "Le Duplex" },
    );

    expect(result).toEqual(places);
  });
});
