import { IndiaMapsError } from '../errors';
import { resolveAccessToken, resolveProviderHosts } from '../utils/config';
import { toLatLngString, toLngLat } from '../utils/coordinates';
import type { IndiaMapsConfig, MapProvider } from '../types/common';
import type {
  MapConfiguration,
  MapOptions,
  StaticMapMarker,
  StaticMapOptions,
  StaticMapPathOptions,
  TransformRequest,
} from '../types/tiles';

const DEFAULT_STYLE = 'default-light-standard';

/**
 * Tiles API: MapLibre style URLs, static map image URLs, and a request
 * transformer that injects credentials into tile requests.
 */
export class TilesApi {
  private readonly accessToken?: string;
  private readonly tileBaseUrl: string;
  private readonly provider: MapProvider;

  constructor(config: IndiaMapsConfig = {}) {
    const provider = config.provider ?? 'ola';
    this.accessToken = resolveAccessToken(config);
    this.provider = provider;
    this.tileBaseUrl =
      config.tileBaseUrl ??
      config.baseUrl ??
      resolveProviderHosts(provider).tiles;
  }

  /** Returns the effective style identifier. @default 'default-light-standard' */
  getStyleName(styleName?: string): string {
    return styleName ?? DEFAULT_STYLE;
  }

  /**
   * Returns a MapLibre style URL with the credential embedded for Ola Maps.
   * For Mappls (no public vector styles) this returns the style name itself.
   */
  getStyleURL(styleName?: string): string {
    const style = this.getStyleName(styleName);
    if (this.provider === 'mappls') {
      return style;
    }
    const url = new URL(
      `/tiles/vector/v1/styles/${style}/style.json`,
      this.tileBaseUrl
    );
    if (this.accessToken) {
      url.searchParams.set('api_key', this.accessToken);
    }
    return url.toString();
  }

  /**
   * Returns a transform request function that appends the API key to Ola Maps
   * tile requests. Pass it to MapLibre's `transformRequest` map option.
   */
  getTransformRequest(): (url: string) => TransformRequest {
    const apiKey = this.accessToken;
    return (url: string): TransformRequest => {
      if (apiKey && url.includes('olamaps.io')) {
        const parsedUrl = new URL(url);
        parsedUrl.searchParams.set('api_key', apiKey);
        return { url: parsedUrl.toString() };
      }
      return { url };
    };
  }

  /** Returns a full MapLibre map configuration. */
  getMapOptions(options?: MapOptions): MapConfiguration {
    return {
      mapStyle: this.getStyleURL(options?.style),
      center: options?.center,
      zoom: options?.zoom ?? 12,
      bearing: options?.bearing ?? 0,
      pitch: options?.pitch ?? 0,
    };
  }

  /**
   * Returns a static map image URL.
   *
   * @throws {@linkcode IndiaMapsError} with code `'CONFIGURATION_ERROR'` when
   * no credential is configured.
   */
  getStaticMapURL(options: StaticMapOptions): string {
    const accessToken = this.accessToken;
    if (accessToken === undefined) {
      throw new IndiaMapsError(
        'TilesApi.getStaticMapURL requires accessToken (or apiKey alias) in IndiaMapsClient config.',
        'CONFIGURATION_ERROR'
      );
    }

    if (this.provider === 'mappls') {
      return this.getMapplsStaticMapURL(options, accessToken);
    }

    return this.getOlaStaticMapURL(options, accessToken);
  }

  private getOlaStaticMapURL(
    options: StaticMapOptions,
    accessToken: string
  ): string {
    const style = this.getStyleName(options.style);
    const format = options.format ?? 'png';
    const [longitude, latitude] = options.center;
    const url = new URL(
      `/tiles/v1/styles/${encodeURIComponent(style)}/static/` +
        `${longitude},${latitude},${options.zoom}/` +
        `${options.width}x${options.height}.${format}`,
      this.tileBaseUrl
    );
    options.markers?.forEach((marker) =>
      url.searchParams.append('marker', toOlaMarkerString(marker))
    );
    if (options.path) {
      url.searchParams.set('path', toOlaPathString(options.path));
    }
    url.searchParams.set('api_key', accessToken);
    return url.toString();
  }

  private getMapplsStaticMapURL(
    options: StaticMapOptions,
    accessToken: string
  ): string {
    const url = new URL('/map/raster_tile/still_image', this.tileBaseUrl);
    url.searchParams.set('center', `${options.center[1]},${options.center[0]}`);
    url.searchParams.set('zoom', String(options.zoom));
    url.searchParams.set('size', `${options.width}x${options.height}`);
    url.searchParams.set(
      'ssf',
      options.scaleFactor ? String(options.scaleFactor) : '1'
    );
    options.markers?.forEach((marker) =>
      url.searchParams.append('markers', toMarkerString(marker))
    );
    if (options.markerIcon) {
      url.searchParams.set('markers_icon', options.markerIcon);
    }
    url.searchParams.set('access_token', accessToken);
    return url.toString();
  }
}

const toMarkerString = (marker: StaticMapMarker): string =>
  typeof marker === 'string' ? marker : toLatLngString(marker);

/**
 * Formats a marker for the Ola Maps static API, which uses `lng,lat` order.
 * Plain `"lat,lng"` strings are converted; preformatted provider strings
 * (with options such as `|red|scale:0.9`) pass through unchanged.
 */
const toOlaMarkerString = (marker: StaticMapMarker): string => {
  if (typeof marker === 'string') {
    if (!isPlainLatLngString(marker)) {
      return marker;
    }
    const [longitude, latitude] = toLngLat(marker as `${number},${number}`);
    return `${longitude},${latitude}`;
  }
  const [longitude, latitude] = toLngLat(marker);
  return `${longitude},${latitude}`;
};

const toOlaPathString = (path: StaticMapPathOptions): string => {
  const parts = path.coordinates.map((point) => toOlaMarkerString(point));
  if (path.widthPx !== undefined) {
    parts.push(`width:${path.widthPx}`);
  }
  if (path.strokeColor !== undefined) {
    parts.push(`stroke:${path.strokeColor}`);
  }
  return parts.join('|');
};

const isPlainLatLngString = (value: string): boolean =>
  /^\s*-?\d+(\.\d+)?,-?\d+(\.\d+)?\s*$/.test(value);
