import type { Language, LatLngInput, LatLngLiteral } from './common';

/** Options accepted by {@linkcode PlacesApi.autocomplete}. */
export type AutocompleteOptions = {
  /** Biases results toward this coordinate. */
  location?: LatLngInput;

  /** Bias radius in meters (Ola Maps). */
  radius?: number;

  /** Restricts results to the bias radius (Ola Maps). */
  strictBounds?: boolean;

  /** Response language. */
  language?: Language;

  /** Restricts results to a provider-specific place type, e.g. `'restaurant'`. */
  types?: string;

  /** Mappls: ranks hyper-local results higher; requires `location`. */
  hyperLocal?: boolean;

  /**
   * Mappls result filter, e.g. `'pin:110055'`,
   * `'bounds:lat1,lng1;lat2,lng2'` or `'cop:{eLoc}'`.
   */
  filter?: string;

  /**
   * Mappls place type code restricting results:
   * `'SLC'`, `'LC'`, `'CITY'`, `'VLG'`, `'SDIST'`, `'DIST'`, `'STATE'`, `'SSLC'`.
   */
  pod?: string;

  /** Mappls: returns structured address tokens in results. */
  tokenizeAddress?: boolean;
};

/**
 * A provider-normalized autocomplete suggestion returned by
 * {@linkcode PlacesApi.autocomplete}, {@linkcode PlacesApi.nearbySearch} and
 * {@linkcode PlacesApi.textSearch}.
 */
export type AutocompleteSuggestion = {
  /**
   * Stable place identifier: an Ola Maps `place_id` or a Mappls
   * eLoc/`mapplsPin`. Pass it to {@linkcode PlacesApi.placeDetails}.
   */
  placeId: string;

  /** Primary display name of the place. */
  name: string;

  /** Secondary address text, when the provider returns one. */
  address?: string;

  /** Distance in meters from the bias location, when reported. */
  distanceMeters?: number;

  /** Result coordinate, when the provider includes one. */
  location?: LatLngLiteral;

  /** Provider result categories, when returned. */
  types?: string[];
};

/** Options accepted by {@linkcode PlacesApi.geocode}. */
export type GeocodeOptions = {
  /** Response language. */
  language?: Language;
};

/**
 * A provider-normalized geocoding result returned by
 * {@linkcode PlacesApi.geocode} and {@linkcode PlacesApi.addressValidation}.
 */
export type GeocodeResult = {
  /** Stable place identifier, when the provider returns one. */
  placeId?: string;

  /** Human-readable formatted address. */
  formattedAddress?: string;

  /** Resolved coordinate. */
  location?: LatLngLiteral;
};

/** Options accepted by {@linkcode PlacesApi.reverseGeocode}. */
export type ReverseGeocodeOptions = {
  /** Response language. */
  language?: Language;
};

/**
 * A provider-normalized reverse-geocoding result returned by
 * {@linkcode PlacesApi.reverseGeocode}.
 */
export type ReverseGeocodeResult = GeocodeResult;

/** Options accepted by {@linkcode PlacesApi.placeDetails}. */
export type PlaceDetailsOptions = {
  /** Response language. */
  language?: Language;
};

/**
 * Provider-normalized place details returned by
 * {@linkcode PlacesApi.placeDetails}.
 */
export type PlaceDetails = {
  /** Stable place identifier. */
  placeId?: string;

  /** Primary display name of the place. */
  name?: string;

  /** Human-readable formatted address. */
  formattedAddress?: string;

  /** Place coordinate. */
  location?: LatLngLiteral;
};

/** Options accepted by {@linkcode PlacesApi.nearbySearch}. */
export type NearbySearchOptions = {
  /** Search radius in meters (Ola Maps). */
  radius?: number;

  /** Free-text keyword, e.g. `'coffee'` (used by Mappls). */
  keyword?: string;

  /** Restricts results to a provider-specific place type (Ola Maps). */
  types?: string;

  /**
   * Result ranking (Ola Maps). `'popular'` ranks by popularity, `'distance'`
   * ranks by distance from `location`. @default 'popular'
   */
  rankBy?: 'popular' | 'distance';

  /**
   * Include centroid geometry on returned places (Ola Maps).
   * @default false
   */
  withCentroid?: boolean;

  /**
   * Maximum number of results to return (Ola Maps). Between 5 and 50.
   * @default 5
   */
  limit?: number;

  /** Response language (Ola Maps). */
  language?: Language;

  /** Mappls: page number, 10 results per page. */
  page?: number;

  /** Mappls bounds filter: `'lat1,lng1;lat2,lng2'`. */
  bounds?: string;

  /**
   * Mappls result filter, e.g. `'pin:110055'` or
   * `'bounds:lat1,lng1;lat2,lng2'`.
   */
  filter?: string;

  /** Mappls sort order, e.g. `'dist:asc'`. */
  sortBy?: string;

  /**
   * Mappls place type code restricting results:
   * `'SLC'`, `'LC'`, `'CITY'`, `'STATE'`.
   */
  pod?: string;
};

/**
 * A provider-normalized nearby place returned by
 * {@linkcode PlacesApi.nearbySearch}.
 */
export type NearbySearchResult = AutocompleteSuggestion;

/** Options accepted by {@linkcode PlacesApi.textSearch}. */
export type TextSearchOptions = {
  /** Biases results toward this coordinate. */
  location?: LatLngInput;

  /** Bias radius in meters (Ola Maps). */
  radius?: number;

  /** Restricts results to a provider-specific place type (Ola Maps). */
  types?: string;

  /**
   * Maximum number of results to return (Ola Maps).
   * @default 5
   */
  size?: number;

  /** Mappls result filter, e.g. `'pin:110055'`. */
  filter?: string;
};

/**
 * A provider-normalized text-search result returned by
 * {@linkcode PlacesApi.textSearch}.
 */
export type TextSearchResult = AutocompleteSuggestion;

/**
 * Result of {@linkcode PlacesApi.addressValidation}, which reports whether
 * Ola Maps considers the address deliverable and its normalized form.
 */
export type AddressValidationResult = {
  /** Whether the provider validated the address. */
  isAddressValid: boolean;

  /** Normalized address text, when the provider returns one. */
  validatedAddress?: string;
};
