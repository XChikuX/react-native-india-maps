import { BaseApi } from './base';
import { IndiaMapsError } from '../errors';
import { arrayOf, asNumber, toLatLngLiteral, type Raw } from '../utils/parse';
import { toLatLngString } from '../utils/coordinates';
import type { ElevationResult, MultiElevationResult } from '../types/elevation';
import type { LatLngInput } from '../types/common';

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
  async getElevation(lat: number, lng: number): Promise<ElevationResult> {
    const results = await this.getMultiElevation([{ lat, lng }]);
    const first = results.results[0];
    if (first === undefined) {
      throw new IndiaMapsError(
        'Elevation API returned no results.',
        'PARSE_ERROR'
      );
    }
    return first;
  }

  /**
   * Returns elevations for multiple coordinates, in input order.
   *
   * @throws {@linkcode IndiaMapsError} on configuration, network or API failure.
   */
  async getMultiElevation(
    points: LatLngInput[]
  ): Promise<MultiElevationResult> {
    this.requireAccessToken('ElevationApi.getMultiElevation');
    const locations = points.map(toLatLngString).join('|');

    if (this.provider === 'mappls') {
      const response = await this.request<Raw>(
        '/map/utils/elevation',
        {
          params: { locations },
        },
        this.elevationTarget
      );
      return { results: normalizeElevations(response) };
    }

    const response = await this.request<Raw>(
      '/elevation/v1/getElevation',
      {
        params: { locations },
      },
      this.elevationTarget
    );
    return { results: normalizeElevations(response) };
  }
}
