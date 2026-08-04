export type GeocodedPlace = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export interface GeocodingPort {
  searchPlaces: (query: string) => Promise<GeocodedPlace[]>;
}
