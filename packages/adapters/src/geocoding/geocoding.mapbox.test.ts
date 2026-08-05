import { afterEach, describe, expect, it, vi } from "vitest";
import { makeGeocoding } from "./geocoding.mapbox.js";

describe("makeGeocoding", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns an empty array without calling fetch for a blank query", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const geocoding = makeGeocoding({ accessToken: "test-token" });
    const result = await geocoding.searchPlaces("   ");

    expect(result).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("maps Mapbox forward geocoding results to GeocodedPlace", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            properties: {
              name: "Le Duplex",
              full_address: "42 rue de la République, 69002 Lyon, France",
            },
            geometry: { coordinates: [4.8357, 45.764] },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const geocoding = makeGeocoding({ accessToken: "test-token" });
    const result = await geocoding.searchPlaces("Le Duplex Lyon");

    expect(result).toEqual([
      {
        name: "Le Duplex",
        address: "42 rue de la République, 69002 Lyon, France",
        lat: 45.764,
        lng: 4.8357,
      },
    ]);
    const requestedUrl = fetchSpy.mock.calls[0][0] as URL;
    expect(requestedUrl.toString()).toContain("q=Le+Duplex+Lyon");
    expect(requestedUrl.toString()).toContain("access_token=test-token");
  });

  it("throws an UnknownError when the Mapbox request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const geocoding = makeGeocoding({ accessToken: "test-token" });
    await expect(geocoding.searchPlaces("Lyon")).rejects.toMatchObject({ type: "UNKNOWN" });
  });
});
