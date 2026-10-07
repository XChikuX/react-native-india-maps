/**
 * Error codes carried by {@linkcode IndiaMapsError}:
 *
 * - `'CONFIGURATION_ERROR'` — the client is misconfigured, e.g. an API call
 *   was made without an access token.
 * - `'NETWORK_ERROR'` — the request failed before the provider responded,
 *   e.g. no connectivity or an invalid URL.
 * - `'API_ERROR'` — the provider returned a non-2xx HTTP response.
 * - `'PARSE_ERROR'` — the provider response could not be interpreted as the
 *   expected result shape.
 * - `'UNSUPPORTED_ERROR'` — the feature is not available for the configured
 *   {@linkcode MapProvider} or as a public API.
 * - `'INVALID_INPUT_ERROR'` — an argument is outside the range or shape the
 *   provider accepts, e.g. more waypoints than the routing API allows.
 */
export type IndiaMapsErrorCode =
  | 'CONFIGURATION_ERROR'
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'PARSE_ERROR'
  | 'UNSUPPORTED_ERROR'
  | 'INVALID_INPUT_ERROR';

/**
 * Error thrown by every fallible SDK operation.
 *
 * API and network failures are always surfaced by throwing this error —
 * results are never silently swallowed. Inspect {@linkcode IndiaMapsError.code}
 * to distinguish failure classes and {@linkcode IndiaMapsError.status} for the
 * HTTP status when the provider responded.
 */
export class IndiaMapsError extends Error {
  /** Machine-readable failure class. See {@linkcode IndiaMapsErrorCode}. */
  readonly code: IndiaMapsErrorCode;

  /** HTTP status code when the failure came from a provider response. */
  readonly status?: number;

  /** Raw provider response body, when one was received. */
  readonly response?: unknown;

  constructor(
    message: string,
    code: IndiaMapsErrorCode = 'API_ERROR',
    options?: { status?: number; response?: unknown }
  ) {
    super(message);
    this.name = 'IndiaMapsError';
    this.code = code;
    this.status = options?.status;
    this.response = options?.response;
  }
}
