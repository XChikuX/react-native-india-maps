import type { LatLng } from './common';
import type { TravelMode } from './routing';

/**
 * A raw GPS coordinate accepted by roads endpoints.
 *
 * @see {@linkcode RoadsApi.snapToRoad}
 */
export type RoadPoint = {
  latitude: number;
  longitude: number;
};

/**
 * A point snapped to the road network, returned by
 * {@linkcode RoadsApi.snapToRoad} and {@linkcode RoadsApi.nearestRoads}.
 */
export type SnappedPoint = {
  /** Snapped coordinate on the road. */
  location: LatLng;

  /** Index of the input point this snap corresponds to, when reported. */
  originalIndex?: number;

  /**
   * How the point was matched, when reported (Ola Maps: `'Nearest'`,
   * `'Match'` or `'NoSegment'`).
   */
  snappedType?: string;

  /** Provider road-segment identifier, when reported. */
  placeId?: string;
};

/**
 * Provider-normalized snap-to-road result returned by
 * {@linkcode RoadsApi.snapToRoad}.
 */
export type SnapToRoadResult = {
  /** Input points mapped onto the road network. */
  snappedPoints: SnappedPoint[];
};

/** Options accepted by {@linkcode RoadsApi.nearestRoads}. */
export type NearestRoadsOptions = {
  /**
   * Travel mode used to validate snapping (Ola Maps only; it is sent as an
   * uppercase mode). @default 'driving'
   */
  mode?: TravelMode;

  /** Search radius in meters (Ola Maps only). @default 500 */
  radius?: number;
};

/**
 * Provider-normalized nearest-roads result returned by
 * {@linkcode RoadsApi.nearestRoads}. On Mappls this is approximated by
 * snapping each input point to the nearest road.
 */
export type NearestRoadsResult = {
  /** Input points mapped onto the road network. */
  snappedPoints: SnappedPoint[];
};

/**
 * Snapping strategy for {@linkcode RoadsApi.speedLimits}: `'snap-to-road'`
 * aligns points to the road network with trace-based logic; `'nearest-road'`
 * snaps each point individually to the nearest segment.
 *
 * @see {@linkcode SpeedLimitsOptions.snapStrategy}
 */
export type SpeedLimitSnapStrategy = 'snap-to-road' | 'nearest-road';

/** Options accepted by {@linkcode RoadsApi.speedLimits}. */
export type SpeedLimitsOptions = {
  /** Snapping strategy applied to the input points. @default 'snap-to-road' */
  snapStrategy?: SpeedLimitSnapStrategy;
};

/** A speed-limit reading for a road segment. */
export type SpeedLimit = {
  /** Index of the input point this limit belongs to, when reported. */
  originalIndex?: number;

  /** Speed limit in km/h. */
  speedLimit: number;
};

/**
 * Provider-normalized speed-limit result returned by
 * {@linkcode RoadsApi.speedLimits}. Ola Maps only.
 */
export type SpeedLimitsResult = {
  /** Speed limits for the matched road segments. */
  speedLimits: SpeedLimit[];

  /** Input points mapped onto the road network. */
  snappedPoints: SnappedPoint[];
};
