import { BaseApi } from './base';
import { IndiaMapsError } from '../errors';
import { arrayOf, asNumber, asString, type Raw } from '../utils/parse';
import type {
  NearestRoadsOptions,
  NearestRoadsResult,
  RoadPoint,
  SnapToRoadResult,
  SnappedPoint,
  SpeedLimitsResult,
} from '../types/roads';

const serializePoints = (points: RoadPoint[]) =>
  points.map((point) => `${point.latitude},${point.longitude}`).join('|');

const serializePointsLngLat = (points: RoadPoint[]) =>
  points.map((point) => `${point.longitude},${point.latitude}`).join(';');

/**
 * Reads a snapped point from a provider payload. Ola Maps returns
 * `location: { latitude, longitude }`; Mappls returns
 * `location: [longitude, latitude]` with `waypoint_index`.
 */
const toSnappedPoint = (raw: Raw): SnappedPoint | undefined => {
  const location = raw.location ?? raw.position ?? raw;

  let latitude: number | undefined;
  let longitude: number | undefined;
  if (Array.isArray(location)) {
    longitude = asNumber(location[0]);
    latitude = asNumber(location[1]);
  } else if (location !== null && typeof location === 'object') {
    const node = location as Raw;
    latitude = asNumber(node.latitude ?? node.lat);
    longitude = asNumber(node.longitude ?? node.lng ?? node.lon);
  }

  if (latitude === undefined || longitude === undefined) {
    return undefined;
  }
  return {
    location: { latitude, longitude },
    originalIndex: asNumber(
      raw.originalIndex ?? raw.index ?? raw.waypoint_index
    ),
    placeId: asString(raw.placeId ?? raw.place_id),
  };
};

/**
 * Roads API: snap GPS points to the road network and look up speed limits.
 */
export class RoadsApi extends BaseApi {
  /**
   * Snaps GPS points to the road network.
   *
   * @param enhancePath Requests an interpolated path between the snapped
   * points. Ola Maps only; ignored by Mappls, whose snap-to-road endpoint has
   * no interpolation flag.
   * @throws {@linkcode IndiaMapsError} on configuration, network or API failure.
   */
  async snapToRoad(
    points: RoadPoint[],
    enhancePath?: boolean
  ): Promise<SnapToRoadResult> {
    this.requireAccessToken('RoadsApi.snapToRoad');
    if (this.provider === 'mappls') {
      const response = await this.request<Raw>(
        '/route/movement/snapToRoad',
        {
          params: {
            pts: serializePointsLngLat(points),
          },
        },
        this.routeTarget
      );
      return { snappedPoints: this.normalizeSnappedPoints(response) };
    }

    const response = await this.request<Raw>(
      '/routing/v1/snapToRoad',
      {
        params: {
          points: serializePoints(points),
          interpolate: enhancePath,
        },
      },
      this.routeTarget
    );
    return { snappedPoints: this.normalizeSnappedPoints(response) };
  }

  /**
   * Maps each input point to the nearest road. On Mappls this is implemented
   * via point-wise {@linkcode RoadsApi.snapToRoad}.
   *
   * @throws {@linkcode IndiaMapsError} on configuration, network or API failure.
   */
  async nearestRoads(
    points: RoadPoint[],
    options?: NearestRoadsOptions
  ): Promise<NearestRoadsResult> {
    this.requireAccessToken('RoadsApi.nearestRoads');
    if (this.provider === 'mappls') {
      return this.snapToRoad(points);
    }

    const response = await this.request<Raw>(
      '/routing/v1/nearestRoads',
      {
        params: {
          points: serializePoints(points),
          radius: options?.radius,
        },
      },
      this.routeTarget
    );
    return { snappedPoints: this.normalizeSnappedPoints(response) };
  }

  /**
   * Returns speed limits for the road segments nearest to the points.
   * Ola Maps only.
   *
   * @throws {@linkcode IndiaMapsError} with code `'UNSUPPORTED_ERROR'` when
   * the configured provider is Mappls; it has no public speed-limit API.
   */
  async speedLimits(points: RoadPoint[]): Promise<SpeedLimitsResult> {
    this.requireAccessToken('RoadsApi.speedLimits');
    if (this.provider === 'mappls') {
      throw new IndiaMapsError(
        'Mappls does not expose speed limit lookup in the public API. Use a dedicated backend integration if your account has access.',
        'UNSUPPORTED_ERROR'
      );
    }

    const response = await this.request<Raw>(
      '/routing/v1/speedLimits',
      {
        params: {
          points: serializePoints(points),
        },
      },
      this.routeTarget
    );
    const raw = (response ?? {}) as Raw;
    return {
      speedLimits: arrayOf(raw.speedLimits),
      snappedPoints: this.normalizeSnappedPoints(response),
    };
  }

  private normalizeSnappedPoints(response: unknown): SnappedPoint[] {
    const raw = (response ?? {}) as Raw;
    const results = (raw.results ?? {}) as Raw;

    const topLevel = arrayOf<Raw | null>(raw.snappedPoints);
    const nested = arrayOf<Raw | null>(results.snappedPoints);
    const list = topLevel.length
      ? topLevel
      : nested.length
        ? nested
        : arrayOf<Raw | null>(raw.locations);

    return list
      .map((point) => (point === null ? undefined : toSnappedPoint(point)))
      .filter((point): point is SnappedPoint => point !== undefined);
  }
}
