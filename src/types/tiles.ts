import type { LatLngInput } from './common';

/**
 * Well-known Ola Maps style presets. Pass one of these values as the
 * `styleName` prop of {@linkcode MapView} or to
 * {@linkcode TilesApi.getStyleURL}, or use any provider-specific style name.
 */
export const MAP_STYLES = {
  lightStandard: 'default-light-standard',
  darkStandard: 'default-dark-standard',
  lightLite: 'default-light-lite',
  darkLite: 'default-dark-lite',
  lightFull: 'default-light-full',
  darkFull: 'default-dark-full',
  eclipseLight: 'eclipse-light-standard',
  eclipseDark: 'eclipse-dark-standard',
  boltLight: 'bolt-light',
  boltDark: 'bolt-dark',
  vintageLight: 'vintage-light',
  vintageDark: 'vintage-dark',
} as const;

/** One of the known {@linkcode MAP_STYLES} presets. */
export type MapStyleName = (typeof MAP_STYLES)[keyof typeof MAP_STYLES];

/**
 * A map style identifier: one of the {@linkcode MAP_STYLES} presets or any
 * custom style name exposed by the provider.
 */
export type MapStyle = MapStyleName | (string & Record<never, never>);

/** Options for building a full MapLibre map configuration. */
export type MapOptions = {
  /** Style identifier. @default 'default-light-standard' */
  style?: MapStyle;

  /** Center coordinate in `[longitude, latitude]` order. */
  center?: [longitude: number, latitude: number];

  /** Zoom level. @default 12 */
  zoom?: number;

  /** Bearing in degrees. @default 0 */
  bearing?: number;

  /** Pitch in degrees. @default 0 */
  pitch?: number;
};

/**
 * Resolved MapLibre map configuration returned by
 * {@linkcode TilesApi.getMapOptions}. Unlike {@linkcode MapOptions}, the
 * defaults are already applied, so only `center` can be absent.
 */
export type MapConfiguration = {
  /** Style URL or style name to pass to MapLibre's `mapStyle` prop. */
  mapStyle: string;

  /** Initial center in `[longitude, latitude]` order, when requested. */
  center?: [longitude: number, latitude: number];

  /** Initial zoom level. */
  zoom: number;

  /** Initial bearing in degrees. */
  bearing: number;

  /** Initial pitch in degrees. */
  pitch: number;
};

/**
 * Marker accepted by static-map URLs: any coordinate, or a raw
 * `"latitude,longitude"` string. Ola Maps additionally accepts preformatted
 * provider strings such as `'77.61,12.93|red|scale:0.9'`.
 */
export type StaticMapMarker = LatLngInput | string;

/** Image format returned by Ola Maps static-map URLs. */
export type StaticMapImageFormat = 'png' | 'jpg';

/**
 * A polyline overlay for static-map images (Ola Maps only). Passed to
 * {@linkcode StaticMapOptions.path}.
 */
export type StaticMapPathOptions = {
  /** Two or more connected points drawn in order. */
  coordinates: StaticMapMarker[];

  /** Line width in pixels, when set. */
  widthPx?: number;

  /** Line color as a hex value, e.g. `'#00ff44'`, when set. */
  strokeColor?: string;
};

/** Options accepted by {@linkcode TilesApi.getStaticMapURL}. */
export type StaticMapOptions = {
  /** Center coordinate in `[longitude, latitude]` order. */
  center: [longitude: number, latitude: number];

  /** Zoom level. Ola Maps clamps values above 23 to 23. */
  zoom: number;

  /** Image width in pixels (Ola Maps: 1-2048). */
  width: number;

  /** Image height in pixels (Ola Maps: 1-2048). */
  height: number;

  /**
   * Style identifier (Ola Maps only). Static images currently render only
   * `default-light-standard` and `default-dark-standard`.
   */
  style?: MapStyle;

  /** Markers to draw on the image. */
  markers?: StaticMapMarker[];

  /** Image format (Ola Maps only). @default 'png' */
  format?: StaticMapImageFormat;

  /** Path overlay to draw on the image (Ola Maps only). */
  path?: StaticMapPathOptions;

  /** Custom marker icon URL (Mappls only). */
  markerIcon?: string;

  /** Static-image scale factor (Mappls only). */
  scaleFactor?: number;
};

/**
 * Transformed resource request returned by
 * {@linkcode TilesApi.getTransformRequest}.
 */
export type TransformRequest = {
  /** URL to fetch the resource from. */
  url: string;

  /** Additional headers for the request. */
  headers?: Record<string, string>;
};
