import type { LatLngInput, LatLngString, LngLat } from '../types/common';

/**
 * Converts any accepted coordinate representation to a
 * `"latitude,longitude"` string, the order used by query parameters.
 *
 * @example
 * toLatLngString({ latitude: 12.97, longitude: 77.59 }); // '12.97,77.59'
 */
export function toLatLngString(location: LatLngInput): LatLngString {
  if (typeof location === 'string') {
    return location;
  }
  const [lng, lat] = toLngLat(location);
  return `${lat},${lng}`;
}

/**
 * Converts any accepted coordinate representation to GeoJSON order:
 * a `[longitude, latitude]` tuple used by MapLibre and routing paths.
 *
 * @example
 * toLngLat({ latitude: 12.97, longitude: 77.59 }); // [77.59, 12.97]
 */
export function toLngLat(location: LatLngInput): LngLat {
  if (typeof location === 'string') {
    const [latPart, lngPart] = location.split(',');
    const lat = Number(latPart);
    const lng = Number(lngPart);
    return [Number.isFinite(lng) ? lng : 0, Number.isFinite(lat) ? lat : 0];
  }

  if (Array.isArray(location)) {
    return [location[0], location[1]];
  }

  if ('latitude' in location) {
    return [location.longitude, location.latitude];
  }

  return [location.lng, location.lat];
}

/**
 * Joins coordinates into a provider query-parameter list in
 * `[latitude,longitude]` order, e.g. `'12.97,77.59|12.98,77.60'`.
 */
export function joinLatLng(
  locations: LatLngInput[],
  separator: string = '|'
): string {
  return locations.map((location) => toLatLngString(location)).join(separator);
}

/**
 * Joins coordinates into a provider path segment in `[longitude,latitude]`
 * order, e.g. `'77.59,12.97;77.60,12.98'`.
 */
export function joinLngLat(
  locations: LatLngInput[],
  separator: string = ';'
): string {
  return locations
    .map((location) => toLngLat(location).join(','))
    .join(separator);
}
