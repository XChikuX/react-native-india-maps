import type { LatLngLiteral, LngLat } from '../types/common';

/** Loose provider payload shape used by response normalizers. */
export type Raw = Record<string, unknown>;

/**
 * Extracts a finite number from a provider value that may arrive as a number
 * or a numeric string. Returns `undefined` for anything else.
 */
export function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/** Extracts a string from a provider value, or `undefined`. */
export function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Extracts a metric value that providers may send either as a bare number or
 * wrapped as `{ value: number }`, e.g. distance/duration matrix cells.
 */
export function asMetric(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (value !== null && typeof value === 'object') {
    return asNumber((value as Raw).value);
  }
  return undefined;
}

/**
 * Builds a {@linkcode LatLngLiteral} from separate lat/lng provider values
 * (either numbers or numeric strings), or `undefined` when either is missing.
 */
export function toLatLngLiteral(
  lat: unknown,
  lng: unknown
): LatLngLiteral | undefined {
  const latNumber = asNumber(lat);
  const lngNumber = asNumber(lng);
  if (latNumber === undefined || lngNumber === undefined) {
    return undefined;
  }
  return { lat: latNumber, lng: lngNumber };
}

/**
 * Extracts a `[longitude, latitude]` tuple from a provider value, or
 * `undefined` when it is not a coordinate pair.
 */
export function asLngLat(value: unknown): LngLat | undefined {
  if (Array.isArray(value) && value.length >= 2) {
    const lng = asNumber(value[0]);
    const lat = asNumber(value[1]);
    if (lng !== undefined && lat !== undefined) {
      return [lng, lat];
    }
  }
  return undefined;
}

/** Returns the value when it is an array, otherwise an empty array. */
export function arrayOf<T = Raw>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * Normalizes a provider value that is either a single object or an array of
 * objects into an array, e.g. geocoding `copResults` which is a bare object
 * for single-result lookups and an array otherwise.
 */
export function arrayOrSingleOf<T = Raw>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (value !== null && typeof value === 'object') {
    return [value as T];
  }
  return [];
}
