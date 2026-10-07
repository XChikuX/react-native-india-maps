import type { LatLng } from './common';

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
  /** Search radius in meters (Ola Maps only). */
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

/** A speed-limit reading for a road segment. */
export type SpeedLimit = {
  /** Provider road-segment identifier. */
  placeId: string;

  /** Speed limit value in `units`. */
  speedLimit: number;

  /** Unit of {@linkcode SpeedLimit.speedLimit}. */
  units: 'KPH' | 'MPH';
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
