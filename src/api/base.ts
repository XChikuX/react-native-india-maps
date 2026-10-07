import { IndiaMapsError } from '../errors';
import { VERSION } from '../version';
import { resolveAccessToken, resolveProviderHosts } from '../utils/config';
import type { IndiaMapsConfig, MapProvider } from '../types/common';

type ParamValue = string | number | boolean | undefined | null;

/** Options for a single HTTP request performed by an API module. */
export type RequestOptions = Omit<RequestInit, 'body'> & {
  /** Query parameters; `undefined` and `null` values are omitted. */
  params?: Record<string, ParamValue>;

  /** Request body; plain objects and arrays are JSON-serialized. */
  body?: BodyInit | Record<string, unknown> | unknown[];

  /** Set when the body is already a serialized string. */
  skipJsonSerialization?: boolean;
};

/**
 * Shared HTTP plumbing for every API module: URL building with provider
 * authentication, JSON serialization, and normalized {@linkcode IndiaMapsError}
 * reporting. Not part of the public API.
 */
export class BaseApi {
  protected readonly accessToken?: string;
  protected readonly baseUrl: string;
  protected readonly provider: MapProvider;
  protected readonly searchBaseUrl: string;
  protected readonly placeDetailsBaseUrl: string;
  protected readonly routeBaseUrl: string;
  protected readonly elevationBaseUrl: string;
  protected readonly sdkBaseUrl: string;

  constructor(config: IndiaMapsConfig) {
    this.accessToken = resolveAccessToken(config);
    this.provider = config.provider ?? 'ola';
    const hosts = resolveProviderHosts(this.provider);

    // `baseUrl` is the global override; the domain-specific URLs layer on top
    // of it so a single proxy or gateway config still applies everywhere.
    // `baseUrl` also redirects Mappls routing, elevation and tiles, which
    // otherwise default to their own provider hosts.
    this.searchBaseUrl = config.searchBaseUrl ?? config.baseUrl ?? hosts.search;
    this.placeDetailsBaseUrl =
      config.searchBaseUrl ?? config.baseUrl ?? hosts.placeDetails;
    this.routeBaseUrl = config.routeBaseUrl ?? config.baseUrl ?? hosts.route;
    this.elevationBaseUrl =
      config.routeBaseUrl ?? config.baseUrl ?? hosts.elevation;
    this.sdkBaseUrl = config.sdkBaseUrl ?? config.baseUrl ?? hosts.search;

    // Fallback for callers that do not pass an explicit target.
    this.baseUrl = config.baseUrl ?? hosts.search;
  }

  /** Request target for places search and geocoding endpoints. */
  protected get searchTarget(): { baseUrl: string } {
    return { baseUrl: this.searchBaseUrl };
  }

  /** Request target for place-details endpoints. */
  protected get placeDetailsTarget(): { baseUrl: string } {
    return { baseUrl: this.placeDetailsBaseUrl };
  }

  /** Request target for routing and roads endpoints. */
  protected get routeTarget(): { baseUrl: string } {
    return { baseUrl: this.routeBaseUrl };
  }

  /** Request target for elevation endpoints. */
  protected get elevationTarget(): { baseUrl: string } {
    return { baseUrl: this.elevationBaseUrl };
  }

  /** Request target for geofencing endpoints. */
  protected get sdkTarget(): { baseUrl: string } {
    return { baseUrl: this.sdkBaseUrl };
  }

  /**
   * Returns the configured access token.
   *
   * @throws {@linkcode IndiaMapsError} with code `'CONFIGURATION_ERROR'` when
   * no token is configured.
   */
  protected requireAccessToken(feature: string): string {
    if (!this.accessToken) {
      throw new IndiaMapsError(
        `${feature} requires accessToken (or apiKey alias) in IndiaMapsClient config.`,
        'CONFIGURATION_ERROR'
      );
    }
    return this.accessToken;
  }

  protected buildUrl(
    path: string,
    params?: Record<string, ParamValue>,
    opts?: { baseUrl?: string }
  ): URL {
    const rawUrl = path.startsWith('http')
      ? path
      : `${opts?.baseUrl ?? this.baseUrl}${path}`;
    const url = new URL(rawUrl);

    if (this.accessToken) {
      const tokenParam =
        this.provider === 'mappls' ? 'access_token' : 'api_key';
      url.searchParams.set(tokenParam, this.accessToken);
    }

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url;
  }

  /**
   * Performs an HTTP request against a provider endpoint and returns the
   * parsed JSON (or text) body.
   *
   * @throws {@linkcode IndiaMapsError} with code `'API_ERROR'` for non-2xx
   * responses, or `'NETWORK_ERROR'` when the request fails before a response.
   */
  protected async request<T>(
    path: string,
    options?: RequestOptions,
    opts?: { baseUrl?: string }
  ): Promise<T> {
    const url = this.buildUrl(path, options?.params, opts);
    const headers = new Headers(options?.headers);
    headers.set('Accept', 'application/json');
    headers.set('X-IndiaMaps-RN-SDK-Version', VERSION);

    let body = options?.body;
    if (
      body != null &&
      !options?.skipJsonSerialization &&
      typeof body === 'object' &&
      !(body instanceof FormData) &&
      !(body instanceof URLSearchParams) &&
      !(body instanceof Blob) &&
      !(body instanceof ArrayBuffer)
    ) {
      headers.set(
        'Content-Type',
        headers.get('Content-Type') ?? 'application/json'
      );
      body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url.toString(), {
        ...options,
        headers,
        body: body as BodyInit | undefined,
      });

      const contentType = response.headers.get('content-type') ?? '';
      const responseBody = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new IndiaMapsError(
          `India Maps API error (${response.status})`,
          'API_ERROR',
          { status: response.status, response: responseBody }
        );
      }

      return responseBody as T;
    } catch (error) {
      if (error instanceof IndiaMapsError) {
        throw error;
      }
      throw new IndiaMapsError(
        error instanceof Error ? error.message : 'India Maps network error',
        'NETWORK_ERROR'
      );
    }
  }
}
