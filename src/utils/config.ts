import type { IndiaMapsConfig, MapProvider } from '../types/common';

/** Host that serves every Ola Maps REST endpoint. */
export const OLA_API_BASE_URL = 'https://api.olamaps.io';

/**
 * Mappls search host: autosuggest, geocoding, reverse geocoding, nearby search
 * and text search.
 */
export const MAPPLS_SEARCH_BASE_URL = 'https://search.mappls.com';

/** Mappls place-details host, used for `eLoc`/`place_id` lookups. */
export const MAPPLS_PLACE_DETAILS_BASE_URL = 'https://place.mappls.com';

/**
 * Mappls routing host: directions, distance matrix, route optimization and
 * snap-to-road.
 */
export const MAPPLS_ROUTE_BASE_URL = 'https://route.mappls.com';

/** Mappls elevation host. */
export const MAPPLS_ELEVATION_BASE_URL = 'https://sdk.mappls.com';

/** Mappls host for raster tile and static map images. */
export const MAPPLS_TILE_BASE_URL = 'https://tile.mappls.com';

/**
 * The hosts a provider exposes, before user overrides are applied. Mappls
 * splits capabilities across several hosts; Ola Maps serves everything from
 * {@linkcode OLA_API_BASE_URL}.
 */
export type ProviderHosts = {
  /** Places search, geocoding and nearby search. */
  search: string;

  /** Place details lookup by `place_id`/`eLoc`. */
  placeDetails: string;

  /** Directions, distance matrix, route optimization and roads. */
  route: string;

  /** Elevation lookups. */
  elevation: string;

  /** Tile styles and static map images. */
  tiles: string;
};

/**
 * Returns the effective access token for a config, preferring
 * `accessToken` over the `apiKey` alias.
 */
export function resolveAccessToken(
  config: IndiaMapsConfig
): string | undefined {
  return config.accessToken ?? config.apiKey;
}

/** Returns the default hosts for a provider. */
export function resolveProviderHosts(provider: MapProvider): ProviderHosts {
  if (provider === 'mappls') {
    return {
      search: MAPPLS_SEARCH_BASE_URL,
      placeDetails: MAPPLS_PLACE_DETAILS_BASE_URL,
      route: MAPPLS_ROUTE_BASE_URL,
      elevation: MAPPLS_ELEVATION_BASE_URL,
      tiles: MAPPLS_TILE_BASE_URL,
    };
  }

  return {
    search: OLA_API_BASE_URL,
    placeDetails: OLA_API_BASE_URL,
    route: OLA_API_BASE_URL,
    elevation: OLA_API_BASE_URL,
    tiles: OLA_API_BASE_URL,
  };
}
