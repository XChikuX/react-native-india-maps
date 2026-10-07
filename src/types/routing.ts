import type { LatLngInput, LngLat } from './common';

/**
 * Travel mode accepted by routing endpoints.
 *
 * - Ola Maps supports `'driving'`, `'walking'`, `'biking'` (sent as `bike`)
 *   and `'auto'`; `'trucking'` throws an
 *   {@linkcode IndiaMapsError} with code `'UNSUPPORTED_ERROR'`.
 * - Mappls supports `'driving'`, `'walking'` and `'biking'`; `'auto'` and
 *   `'trucking'` throw the same error.
 *
 * @see {@linkcode RoutingApi.getDirections}
 */
export type TravelMode = 'driving' | 'walking' | 'biking' | 'auto' | 'trucking';

/**
 * Route geometry detail level. `false` omits the geometry.
 *
 * @see {@linkcode DirectionsOptions.overview}
 */
export type OverviewLevel = 'full' | 'simplified' | false;

/**
 * Encoding of returned route geometries. Mappls only; Ola Maps always returns
 * encoded polylines.
 *
 * @see {@linkcode DirectionsOptions.geometries}
 */
export type GeometryFormat = 'polyline' | 'polyline6' | 'geojson';

/** Mappls routing resource variant. */
export type MapplsRouteResource = 'route_adv' | 'route_eta' | 'route_traffic';

/**
 * Route preference hint accepted by Ola Maps routing endpoints.
 *
 * @see {@linkcode RoutingApi.getDirections}
 */
export type RoutePreference = 'fastest' | 'shortest';

/** Options accepted by {@linkcode RoutingApi.getDirections}. */
export type DirectionsOptions = {
  /** Travel mode. @default 'driving' */
  mode?: TravelMode;

  /** Returns alternative routes in addition to the best one. */
  alternatives?: boolean;

  /** Includes turn-by-turn steps in each leg. Ola Maps default: `true`. */
  steps?: boolean;

  /**
   * Geometry detail level. Ola Maps default: `'full'`.
   */
  overview?: OverviewLevel;

  /** Geometry encoding of returned routes (Mappls only). */
  geometries?: GeometryFormat;

  /**
   * Ordered intermediate stops between the origin and the destination.
   * Ola Maps accepts at most 25 waypoints and keeps their order.
   */
  waypoints?: LatLngInput[];

  /** Response language. */
  language?: string;

  /** Ola Maps: includes live-traffic metadata in the response. */
  trafficMetadata?: boolean;

  /** Ola Maps routing preference. */
  routePreference?: RoutePreference;

  /** Mappls resource variant. @default 'route_adv' */
  resource?: MapplsRouteResource;
};

/**
 * A turn-by-turn step within a {@linkcode RouteLeg}. Optional fields are
 * populated when the request included `steps` and the provider reported them.
 */
export type RouteStep = {
  /** Step distance in meters. */
  distance?: number;

  /** Step duration in seconds. */
  duration?: number;

  /** Road or street name of the step. */
  name?: string;

  /** Route designation of the step, e.g. `'NH44'`. */
  ref?: string;

  /** Maneuver instruction identifier, provider-specific, e.g. `'turn-right'`. */
  maneuver?: string;

  /** Turn-by-turn instruction text, when the provider reports it (Ola Maps). */
  instructions?: string;

  /** Step start coordinate in `[longitude, latitude]` order. */
  location?: LngLat;

  /** Encoded geometry of the step. */
  geometry?: string;
};

/** A leg of a {@linkcode Route}, i.e. the segment between two waypoints. */
export type RouteLeg = {
  /** Leg distance in meters. */
  distance?: number;

  /** Leg duration in seconds. */
  duration?: number;

  /** Short summary of the leg, when reported. */
  summary?: string;

  /** Turn-by-turn steps, present when `steps: true` was requested. */
  steps?: RouteStep[];
};

/** A route between the requested origin and destination. */
export type Route = {
  /** Total route distance in meters. */
  distance?: number;

  /** Total route duration in seconds. */
  duration?: number;

  /** Encoded geometry of the full route. */
  geometry?: string;

  /** Legs between consecutive waypoints. */
  legs?: RouteLeg[];
};

/** A snapped input coordinate echoed by the routing response. */
export type Waypoint = {
  /** Coordinate in `[longitude, latitude]` order. */
  location?: LngLat;

  /** Distance in meters from the input coordinate to the snapped road. */
  distance?: number;

  /** Name of the nearest road, when reported. */
  name?: string;
};

/**
 * Provider-normalized directions result returned by
 * {@linkcode RoutingApi.getDirections}.
 */
export type DirectionsResult = {
  /** Routes from the origin to the destination, best first. */
  routes: Route[];

  /** Snapped input coordinates, when the provider echoes them. */
  waypoints?: Waypoint[];

  /** Provider status code, e.g. `'Ok'`. */
  code?: string;
};

/** Mappls distance-matrix resource variant. */
export type MapplsDistanceMatrixResource =
  'distance_matrix' | 'distance_matrix_eta' | 'distance_matrix_traffic';

/** Options accepted by {@linkcode RoutingApi.getDistanceMatrix}. */
export type DistanceMatrixOptions = {
  /** Travel mode. @default 'driving' */
  mode?: TravelMode;

  /** Ola Maps routing preference. */
  routePreference?: RoutePreference;

  /** Mappls resource variant. @default 'distance_matrix' */
  resource?: MapplsDistanceMatrixResource;
};

/**
 * Provider-normalized distance matrix returned by
 * {@linkcode RoutingApi.getDistanceMatrix}. `distances[i][j]` and
 * `durations[i][j]` describe the trip from `origins[i]` to
 * `destinations[j]`; cells that cannot be computed are `0`.
 */
export type DistanceMatrixResult = {
  /** Distance grid in meters, one row per origin. */
  distances: number[][];

  /** Duration grid in seconds, one row per origin. */
  durations: number[][];
};

/** Mappls route-optimizer resource variant. */
export type MapplsOptimizationResource =
  'trip_optimization' | 'trip_optimization_eta' | 'trip_optimization_traffic';

/** Options accepted by {@linkcode RoutingApi.routeOptimizer}. */
export type RouteOptimizerOptions = {
  /** Travel mode. @default 'driving' */
  mode?: TravelMode;

  /**
   * Fixes the start of the optimized trip. Ola Maps accepts `'first'` and
   * `'any'` only (default `'first'`).
   */
  source?: 'first' | 'last' | 'any';

  /**
   * Fixes the end of the optimized trip. Ola Maps accepts `'last'` and
   * `'any'` only (default `'last'`).
   */
  destination?: 'first' | 'last' | 'any';

  /** Returns to the starting point after the last stop. */
  roundTrip?: boolean;

  /** Includes turn-by-turn steps in returned routes. Ola Maps default: `true`. */
  steps?: boolean;

  /**
   * Geometry detail level. Ola Maps default: `'full'`.
   */
  overview?: OverviewLevel;

  /** Response language. */
  language?: string;

  /** Ola Maps: optimizes using live traffic. */
  trafficMetadata?: boolean;

  /** Ola Maps routing preference. */
  routePreference?: RoutePreference;

  /** Mappls resource variant. */
  resource?: MapplsOptimizationResource;
};

/**
 * Provider-normalized route-optimization result returned by
 * {@linkcode RoutingApi.routeOptimizer}.
 */
export type RouteOptimizerResult = {
  /** Visit order as indices into the input locations. */
  order?: number[];

  /** Optimized routes. */
  routes: Route[];

  /** Snapped input coordinates, when the provider echoes them. */
  waypoints?: Waypoint[];

  /** Total optimized distance in meters, when reported. */
  distance?: number;

  /** Total optimized duration in seconds, when reported. */
  duration?: number;

  /** Provider status code, e.g. `'Ok'`. */
  code?: string;
};
