import { BaseApi } from './base';
import { IndiaMapsError } from '../errors';
import {
  arrayOf,
  asLngLat,
  asMetric,
  asNumber,
  asString,
  type Raw,
} from '../utils/parse';
import { joinLatLng, joinLngLat, toLatLngString } from '../utils/coordinates';
import type { LatLngInput, LngLat } from '../types/common';
import type {
  DirectionsOptions,
  DirectionsResult,
  DistanceMatrixOptions,
  DistanceMatrixResult,
  OverviewLevel,
  Route,
  RouteOptimizerOptions,
  RouteOptimizerResult,
  TravelMode,
  Waypoint,
} from '../types/routing';

/** Maximum waypoints accepted by the Ola Maps directions endpoint. */
const OLA_MAX_WAYPOINTS = 25;

/** Maximum locations accepted by the Ola Maps route-optimizer endpoint. */
const OLA_MAX_OPTIMIZER_LOCATIONS = 25;

const sumLegMetric = (legs: Raw[], key: string): number | undefined => {
  let total = 0;
  let reported = false;
  for (const leg of legs) {
    const value = asMetric(leg[key]);
    if (value !== undefined) {
      total += value;
      reported = true;
    }
  }
  return reported ? total : undefined;
};

/**
 * Reads route geometry from either shape: the legacy `geometry` string or the
 * current `overview_polyline` (a bare string or a `{ points }` object).
 */
const readRouteGeometry = (raw: Raw): string | undefined => {
  const direct = asString(raw.geometry);
  if (direct !== undefined) {
    return direct;
  }
  const polyline = raw.overview_polyline;
  if (typeof polyline === 'string') {
    return polyline;
  }
  if (polyline !== null && typeof polyline === 'object') {
    return asString((polyline as Raw).points);
  }
  return undefined;
};

/** Converts a provider `{ lat, lng }` / `{ latitude, longitude }` object. */
const asLngLatObject = (value: unknown): LngLat | undefined => {
  if (value === null || typeof value !== 'object') {
    return undefined;
  }
  const node = value as Raw;
  const lat = asNumber(node.lat ?? node.latitude);
  const lng = asNumber(node.lng ?? node.longitude);
  if (lat === undefined || lng === undefined) {
    return undefined;
  }
  return [lng, lat];
};

const normalizeRoute = (raw: Raw): Route => {
  const legs = arrayOf(raw.legs);
  return {
    distance: asMetric(raw.distance) ?? sumLegMetric(legs, 'distance'),
    duration: asMetric(raw.duration) ?? sumLegMetric(legs, 'duration'),
    geometry: readRouteGeometry(raw),
    legs: legs.map((leg) => ({
      distance: asMetric(leg.distance),
      duration: asMetric(leg.duration),
      summary: asString(leg.summary),
      steps: arrayOf(leg.steps).map((step) => ({
        distance: asMetric(step.distance),
        duration: asMetric(step.duration),
        name: asString(step.name),
        ref: asString(step.ref),
        maneuver: asString(step.maneuver),
        instructions: asString(step.instructions),
        location:
          asLngLat(step.location) ?? asLngLatObject(step.start_location),
        geometry: asString(step.geometry),
      })),
    })),
  };
};

const normalizeWaypoint = (raw: Raw): Waypoint => ({
  location: asLngLat(raw.location ?? raw.snapped_location),
  distance: asNumber(raw.distance),
  name: asString(raw.name),
});

const toNumberGrid = (grid: unknown): number[][] | undefined =>
  Array.isArray(grid)
    ? grid.map((row) =>
        Array.isArray(row) ? row.map((cell) => asMetric(cell) ?? 0) : []
      )
    : undefined;

/** Maps a {@linkcode TravelMode} to the Ola Maps routing `mode` value. */
const toOlaMode = (mode: TravelMode): string => {
  switch (mode) {
    case 'driving':
    case 'walking':
    case 'auto':
      return mode;
    case 'biking':
      return 'bike';
    case 'trucking':
      throw new IndiaMapsError(
        "Ola Maps routing supports 'driving', 'walking', 'biking' and 'auto'; 'trucking' is not available. Use provider 'mappls' for truck routing or pick a supported mode.",
        'UNSUPPORTED_ERROR'
      );
  }
};

/** Maps a {@linkcode TravelMode} to a Mappls routing profile value. */
const toMapplsMode = (mode: TravelMode): string => {
  switch (mode) {
    case 'driving':
    case 'walking':
    case 'biking':
      return mode;
    case 'auto':
    case 'trucking':
      throw new IndiaMapsError(
        `Mappls routing supports 'driving', 'walking' and 'biking'; '${mode}' is not available. Use provider 'ola' for 'auto' or pick a supported mode.`,
        'UNSUPPORTED_ERROR'
      );
  }
};

/** Serializes overview for Ola endpoints, which accept a string or `false`. */
const serializeOlaOverview = (overview?: OverviewLevel): string | undefined => {
  if (overview === undefined) {
    return undefined;
  }
  return overview === false ? 'false' : overview;
};

const serializeMapplsOverview = (overview?: OverviewLevel): string | boolean =>
  overview === undefined ? true : overview;

/**
 * Routing API: directions, distance matrix and route optimization across
 * Ola Maps and Mappls.
 */
export class RoutingApi extends BaseApi {
  /**
   * Returns routes from `origin` to `destination`, optionally through
   * `waypoints`.
   *
   * @throws {@linkcode IndiaMapsError} with code `'INVALID_INPUT_ERROR'` when
   * Ola Maps receives more than 25 waypoints, or `'UNSUPPORTED_ERROR'` for a
   * mode the configured provider cannot route; also on configuration, network
   * or API failure.
   */
  async getDirections(
    origin: LatLngInput,
    destination: LatLngInput,
    options?: DirectionsOptions
  ): Promise<DirectionsResult> {
    this.requireAccessToken('RoutingApi.getDirections');
    const mode = options?.mode ?? 'driving';

    if (this.provider === 'mappls') {
      const coords = [origin, ...(options?.waypoints ?? []), destination];
      const geopositions = joinLngLat(coords);
      const resource = options?.trafficMetadata
        ? 'route_traffic'
        : (options?.resource ?? 'route_adv');
      const response = await this.request<Raw>(
        `/route/direction/${resource}/${toMapplsMode(mode)}/${geopositions}`,
        {
          params: {
            alternatives: options?.alternatives,
            steps: options?.steps,
            overview: serializeMapplsOverview(options?.overview),
            geometries: options?.geometries,
          },
        },
        this.routeTarget
      );
      return normalizeDirections(response);
    }

    const waypoints = options?.waypoints ?? [];
    if (waypoints.length > OLA_MAX_WAYPOINTS) {
      throw new IndiaMapsError(
        `Ola Maps directions accept at most ${OLA_MAX_WAYPOINTS} waypoints; received ${waypoints.length}.`,
        'INVALID_INPUT_ERROR'
      );
    }

    const response = await this.request<Raw>(
      '/routing/v1/directions',
      {
        method: 'POST',
        params: {
          origin: toLatLngString(origin),
          destination: toLatLngString(destination),
          waypoints: waypoints.length ? joinLatLng(waypoints) : undefined,
          mode: toOlaMode(mode),
          alternatives: options?.alternatives,
          steps: options?.steps,
          overview: serializeOlaOverview(options?.overview),
          language: options?.language,
          traffic_metadata: options?.trafficMetadata,
          route_preference: options?.routePreference,
        },
      },
      this.routeTarget
    );
    return normalizeDirections(response);
  }

  /**
   * Returns travel distance and duration grids from every origin to every
   * destination.
   *
   * @throws {@linkcode IndiaMapsError} with code `'UNSUPPORTED_ERROR'` for a
   * mode the configured provider cannot route; also on configuration, network
   * or API failure.
   */
  async getDistanceMatrix(
    origins: LatLngInput[],
    destinations: LatLngInput[],
    options?: DistanceMatrixOptions
  ): Promise<DistanceMatrixResult> {
    this.requireAccessToken('RoutingApi.getDistanceMatrix');
    const mode = options?.mode ?? 'driving';

    if (this.provider === 'mappls') {
      const resource = options?.resource ?? 'distance_matrix';
      const geopositions = joinLngLat([...origins, ...destinations]);
      const response = await this.request<Raw>(
        `/route/dm/${resource}/${toMapplsMode(mode)}/${geopositions}`,
        {
          params: {
            sources: origins.map((_, index) => index).join(';'),
            destinations: origins
              .map((_, index) => index + origins.length)
              .join(';'),
          },
        },
        this.routeTarget
      );
      return normalizeDistanceMatrix(response);
    }

    const response = await this.request<Raw>(
      '/routing/v1/distanceMatrix',
      {
        params: {
          origins: joinLatLng(origins),
          destinations: joinLatLng(destinations),
          mode: toOlaMode(mode),
          route_preference: options?.routePreference,
        },
      },
      this.routeTarget
    );
    return normalizeDistanceMatrix(response);
  }

  /**
   * Optimizes the visiting order of `locations`.
   *
   * @throws {@linkcode IndiaMapsError} with code `'INVALID_INPUT_ERROR'` when
   * Ola Maps receives more than 25 locations or an unsupported `source` /
   * `destination` anchor, or `'UNSUPPORTED_ERROR'` for a mode the configured
   * provider cannot route; also on configuration, network or API failure.
   */
  async routeOptimizer(
    locations: LatLngInput[],
    options?: RouteOptimizerOptions
  ): Promise<RouteOptimizerResult> {
    this.requireAccessToken('RoutingApi.routeOptimizer');
    const mode = options?.mode ?? 'driving';

    if (this.provider === 'mappls') {
      const geopositions = joinLngLat(locations);
      const resource = options?.resource ?? 'trip_optimization_eta';
      const response = await this.request<Raw>(
        `/route/optimization/${resource}/${toMapplsMode(mode)}/${geopositions}`,
        {
          params: {
            source: options?.source,
            destination: options?.destination,
            roundtrip: options?.roundTrip,
            steps: options?.steps,
            overview: serializeMapplsOverview(options?.overview),
          },
        },
        this.routeTarget
      );
      return normalizeRouteOptimizer(response);
    }

    if (locations.length > OLA_MAX_OPTIMIZER_LOCATIONS) {
      throw new IndiaMapsError(
        `Ola Maps route optimizer accepts at most ${OLA_MAX_OPTIMIZER_LOCATIONS} locations; received ${locations.length}.`,
        'INVALID_INPUT_ERROR'
      );
    }
    if (options?.source === 'last') {
      throw new IndiaMapsError(
        "Ola Maps route optimizer accepts source 'first' or 'any'; 'last' is not supported.",
        'INVALID_INPUT_ERROR'
      );
    }
    if (options?.destination === 'first') {
      throw new IndiaMapsError(
        "Ola Maps route optimizer accepts destination 'last' or 'any'; 'first' is not supported.",
        'INVALID_INPUT_ERROR'
      );
    }

    const response = await this.request<Raw>(
      '/routing/v1/routeOptimizer',
      {
        method: 'POST',
        params: {
          locations: joinLatLng(locations),
          source: options?.source,
          destination: options?.destination,
          round_trip: options?.roundTrip,
          mode: toOlaMode(mode),
          steps: options?.steps,
          overview: serializeOlaOverview(options?.overview),
          language: options?.language,
          traffic_metadata: options?.trafficMetadata,
          route_preference: options?.routePreference,
        },
      },
      this.routeTarget
    );
    return normalizeRouteOptimizer(response);
  }
}

const normalizeDirections = (response: unknown): DirectionsResult => {
  const raw = (response ?? {}) as Raw;
  return {
    // Legacy OSRM-style responses carry `code`; current responses carry `status`.
    code: asString(raw.code) ?? asString(raw.status),
    routes: arrayOf(raw.routes).map(normalizeRoute),
    waypoints: arrayOf(raw.waypoints).map(normalizeWaypoint),
  };
};

const normalizeDistanceMatrix = (response: unknown): DistanceMatrixResult => {
  const raw = (response ?? {}) as Raw;
  const results = (raw.results ?? {}) as Raw;
  const matrix = (raw.matrix ?? {}) as Raw;
  const rows = arrayOf(raw.distanceMatrix);

  const fromGrids = (source: Raw): DistanceMatrixResult | undefined => {
    const distances = toNumberGrid(source.distances);
    const durations = toNumberGrid(source.durations);
    if (distances === undefined || durations === undefined) {
      return undefined;
    }
    return { distances, durations };
  };

  return (
    // Mappls wraps the grids in a `results` envelope.
    fromGrids(results) ??
    // OSRM-style top-level grids (Mappls distance_matrix compatible).
    fromGrids(raw) ??
    fromGrids(matrix) ?? {
      // Ola cell-based rows: distanceMatrix[].distanceMatrixCells[].
      distances: rows.map((row) =>
        arrayOf(row.distanceMatrixCells).map(
          (cell) => asMetric(cell.distance) ?? 0
        )
      ),
      durations: rows.map((row) =>
        arrayOf(row.distanceMatrixCells).map(
          (cell) => asMetric(cell.duration) ?? 0
        )
      ),
    }
  );
};

const normalizeRouteOptimizer = (response: unknown): RouteOptimizerResult => {
  const raw = (response ?? {}) as Raw;
  const rawRoutes = arrayOf(raw.routes ?? raw.trips);
  const routes = rawRoutes.map(normalizeRoute);

  // Current Ola responses carry `waypoint_order` on the first route; legacy
  // payloads and Mappls carry a top-level `order`.
  const firstRoute = rawRoutes[0];
  const orderSource = Array.isArray(raw.order)
    ? raw.order
    : firstRoute !== undefined && Array.isArray(firstRoute.waypoint_order)
      ? firstRoute.waypoint_order
      : undefined;

  const sumRoutes = (key: 'distance' | 'duration'): number | undefined => {
    if (routes.length === 0) {
      return undefined;
    }
    let total = 0;
    let reported = false;
    for (const route of routes) {
      const value = route[key];
      if (value !== undefined) {
        total += value;
        reported = true;
      }
    }
    return reported ? total : undefined;
  };

  return {
    code: asString(raw.code) ?? asString(raw.status),
    order: orderSource?.map((value) => asNumber(value) ?? 0),
    routes,
    waypoints: arrayOf(raw.waypoints).map(normalizeWaypoint),
    distance: asMetric(raw.distance) ?? sumRoutes('distance'),
    duration: asMetric(raw.duration) ?? sumRoutes('duration'),
  };
};
