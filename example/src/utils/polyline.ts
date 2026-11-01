/**
 * Decodes an encoded polyline (the Google/OSRM algorithm used by both Ola Maps
 * and Mappls) into `[longitude, latitude]` tuples, ready for the SDK's
 * `Polyline` component.
 */
/* eslint-disable no-bitwise -- bit arithmetic is inherent to polyline decoding. */
export function decodePolyline(
  encoded: string,
  precision: number = 5
): [number, number][] {
  const factor = Math.pow(10, precision);
  const coordinates: [number, number][] = [];

  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 1;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 1;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push([lng / factor, lat / factor]);
  }

  return coordinates;
}
