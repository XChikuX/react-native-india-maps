/**
 * Geographic coordinate in latitude/longitude order, matching React Native
 * and React Native Maps conventions.
 *
 * @see {@linkcode MapView}
 */
export type LatLng = {
  latitude: number;
  longitude: number;
};

/**
 * GeoJSON-order coordinate tuple: `[longitude, latitude]`. This is the order
 * used by MapLibre and by provider routing path segments.
 */
export type LngLat = [longitude: number, latitude: number];

/**
 * Compact `{ lat, lng }` literal, the order used by most provider payloads.
 */
export type LatLngLiteral = {
  lat: number;
  lng: number;
};

/**
 * Comma-separated `"latitude,longitude"` string, e.g. `"12.9716,77.5946"`,
 * as accepted by provider query parameters.
 */
export type LatLngString = `${number},${number}`;

/**
 * Any coordinate representation accepted by the SDK. Methods normalize all
 * forms internally, so callers can pass whichever shape is convenient.
 *
 * @see {@linkcode PlacesApi.autocomplete}
 * @see {@linkcode RoutingApi.getDirections}
 */
export type LatLngInput = LatLng | LatLngLiteral | LngLat | LatLngString;

/**
 * IETF/BCP-47 language tag accepted by endpoints that support localization,
 * e.g. `'en'`, `'hi'`, `'ta-IN'`. Availability depends on the provider.
 */
export type Language = string;

/**
 * Map data backend used for API requests and tile styles.
 *
 * - `'ola'` — Ola Maps (default). Full API coverage including geofencing and
 *   vector tile styles.
 * - `'mappls'` — Mappls. Places, routing, roads and elevation coverage;
 *   geofencing and public tile styles are not available.
 */
export type MapProvider = 'ola' | 'mappls';

/**
 * Configuration for `IndiaMapsClient`.
 *
 * At least one credential is required for API calls: pass `apiKey` for Ola
 * Maps (the default provider) or `accessToken` with `provider: 'mappls'` for
 * Mappls. Map rendering itself works without credentials for Ola Maps only
 * when a style URL is provided externally.
 *
 * @see {@linkcode IndiaMapsClient}
 */
export type IndiaMapsConfig = {
  /**
   * Mappls access token. Also accepted as a generic alias for `apiKey` when
   * only one credential field is desired.
   */
  accessToken?: string;

  /** Ola Maps API key. */
  apiKey?: string;

  /** Backend provider. @default 'ola' */
  provider?: MapProvider;

  /**
   * Global base URL override applied to every endpoint. The domain-specific
   * overrides below take precedence over it when set.
   */
  baseUrl?: string;

  /**
   * Overrides the base URL for places search, geocoding and place-details
   * endpoints.
   */
  searchBaseUrl?: string;

  /**
   * Overrides the base URL for routing, roads and elevation endpoints.
   */
  routeBaseUrl?: string;

  /** Overrides the base URL for geofencing endpoints (Ola Maps only). */
  sdkBaseUrl?: string;

  /** Overrides the base URL for tile and static-map endpoints. */
  tileBaseUrl?: string;
};
