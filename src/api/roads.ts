import { BaseApi } from './base';
import { IndiaMapsError } from '../errors';
import { arrayOf, asNumber, asString, type Raw } from '../utils/parse';
import { joinLatLng, joinLngLat } from '../utils/coordinates';
import type {
  NearestRoadsOptions,
  NearestRoadsResult,
  RoadPoint,
  SnapToRoadResult,
  SnappedPoint,
  SpeedLimit,
  SpeedLimitsOptions,
  SpeedLimitsResult,
} from '../types/roads';
import type { TravelMode } from '../types/routing';

const serializePointsLngLat = (points: RoadPoint[]): string =>
  joinLngLat(points, ';');

/** Maps a {@linkcode TravelMode} to the Ola Maps roads validation mode. */
const toOlaRoadsMode = (mode: TravelMode): string => {
  switch (mode) {
    case 'driving':
      return 'DRIVING';
    case 'walking':
      return 'WALKING';
    case 'biking':
      return 'BICYCLING';
    case 'auto':
    case 'trucking':
      throw new IndiaMapsError(
        `Ola Maps nearest roads accepts mode 'driving', 'walking' or 'biking' for snap validation; '${mode}' is not supported.`,
        'UNSUPPORTED_ERROR'
      );
  }
};

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
      raw.originalIndex ?? raw.original_index ?? raw.index ?? raw.waypoint_index
    ),
    snappedType: asString(raw.snapped_type ?? raw.snappedType),
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
          points: joinLatLng(points),
          enhancePath: enhancePath,
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
          points: joinLatLng(points),
          mode: toOlaRoadsMode(options?.mode ?? 'driving'),
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
  async speedLimits(
    points: RoadPoint[],
    options?: SpeedLimitsOptions
  ): Promise<SpeedLimitsResult> {
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
          points: joinLatLng(points),
          snapStrategy: options?.snapStrategy
            ? options.snapStrategy === 'snap-to-road'
              ? 'snaptoroad'
              : 'nearestroad'
            : undefined,
        },
      },
      this.routeTarget
    );
    const raw = (response ?? {}) as Raw;
    const speedLimits: SpeedLimit[] = [];
    for (const entry of arrayOf(raw.speedLimits)) {
      const value = asNumber(entry.speedLimit);
      if (value !== undefined) {
        speedLimits.push({
          originalIndex: asNumber(entry.originalIndex),
          speedLimit: value,
        });
      }
    }
    return {
      speedLimits,
      snappedPoints: this.normalizeSnappedPoints(response),
    };
  }

  private normalizeSnappedPoints(response: unknown): SnappedPoint[] {
    const raw = (response ?? {}) as Raw;
    const results = (raw.results ?? {}) as Raw;

    // Ola snapToRoad nests under `snapped_points` (snake case) or the flat
    // `results` array for nearestRoads; Mappls nests `snappedPoints` inside
    // `results`.
    const topLevel = arrayOf<Raw | null>(raw.snappedPoints);
    const snakeCase = arrayOf<Raw | null>(raw.snapped_points);
    const nested = arrayOf<Raw | null>(results.snappedPoints);
    const nestedSnake = arrayOf<Raw | null>(results.snapped_points);
    const resultArray = Array.isArray(raw.results)
      ? arrayOf<Raw | null>(raw.results)
      : [];
    const list = topLevel.length
      ? topLevel
      : snakeCase.length
        ? snakeCase
        : nested.length
          ? nested
          : nestedSnake.length
            ? nestedSnake
            : resultArray.length
              ? resultArray
              : arrayOf<Raw | null>(raw.locations);

    return list
      .map((point) => (point === null ? undefined : toSnappedPoint(point)))
      .filter((point): point is SnappedPoint => point !== undefined);
  }
}
