import { BaseApi } from './base';
import { IndiaMapsError } from '../errors';
import { arrayOf, asNumber, toLatLngLiteral, type Raw } from '../utils/parse';
import { joinLatLng, toLatLngString } from '../utils/coordinates';
import type { ElevationResult, MultiElevationResult } from '../types/elevation';
import type { LatLngInput } from '../types/common';

/** Maximum locations accepted by the Ola Maps multi-elevation endpoint. */
const OLA_MAX_ELEVATION_LOCATIONS = 25;

const normalizeElevations = (response: unknown): ElevationResult[] => {
  const raw = (response ?? {}) as Raw;
  const list = arrayOf(raw.results).length
    ? arrayOf(raw.results)
    : arrayOf(raw.elevations);
  return list.map((item) => {
    // Ola nests the coordinate under `location`; Mappls returns flat
    // `latitude`/`longitude` on the elevation entry itself.
    const position = (item.location ?? item.position ?? item) as Raw;
    return {
      elevation: asNumber(item.elevation) ?? 0,
      location: toLatLngLiteral(
        position.lat ?? position.latitude,
        position.lng ?? position.longitude
      ),
      resolution: asNumber(item.resolution),
    };
  });
};

const firstOrParseError = (results: ElevationResult[]): ElevationResult => {
  const first = results[0];
  if (first === undefined) {
    throw new IndiaMapsError(
      'Elevation API returned no results.',
      'PARSE_ERROR'
    );
  }
  return first;
};

/**
 * Elevation API: single- and multi-point elevation lookups for Ola Maps and
 * Mappls.
 */
export class ElevationApi extends BaseApi {
  /**
   * Returns the elevation of a single coordinate.
   *
   * @throws {@linkcode IndiaMapsError} with code `'PARSE_ERROR'` when the
   * provider returns no result, or on configuration, network or API failure.
   */
  async getElevation(location: LatLngInput): Promise<ElevationResult> {
    this.requireAccessToken('ElevationApi.getElevation');

    if (this.provider === 'mappls') {
      const response = await this.request<Raw>(
        '/map/utils/elevation',
        {
          params: { locations: toLatLngString(location) },
        },
        this.elevationTarget
      );
      return firstOrParseError(normalizeElevations(response));
    }

    const response = await this.request<Raw>(
      '/places/v1/elevation',
      {
        params: { location: toLatLngString(location) },
      },
      this.elevationTarget
    );
    return firstOrParseError(normalizeElevations(response));
  }

  /**
   * Returns elevations for multiple coordinates, in input order. Ola Maps
   * accepts at most 25 coordinates per call.
   *
   * @throws {@linkcode IndiaMapsError} with code `'INVALID_INPUT_ERROR'` when
   * Ola Maps receives more than 25 coordinates; also on configuration, network
   * or API failure.
   */
  async getMultiElevation(
    points: LatLngInput[]
  ): Promise<MultiElevationResult> {
    this.requireAccessToken('ElevationApi.getMultiElevation');

    if (this.provider === 'mappls') {
      const response = await this.request<Raw>(
        '/map/utils/elevation',
        {
          params: { locations: joinLatLng(points) },
        },
        this.elevationTarget
      );
      return { results: normalizeElevations(response) };
    }

    if (points.length > OLA_MAX_ELEVATION_LOCATIONS) {
      throw new IndiaMapsError(
        `Ola Maps elevation accepts at most ${OLA_MAX_ELEVATION_LOCATIONS} coordinates; received ${points.length}.`,
        'INVALID_INPUT_ERROR'
      );
    }

    const response = await this.request<Raw>(
      '/places/v1/elevation',
      {
        method: 'POST',
        body: { locations: points.map((point) => toLatLngString(point)) },
      },
      this.elevationTarget
    );
    return { results: normalizeElevations(response) };
  }
}
