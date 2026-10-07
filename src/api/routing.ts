import { BaseApi } from './base';
import {
  arrayOf,
  asLngLat,
  asMetric,
  asNumber,
  asString,
  type Raw,
} from '../utils/parse';
import { joinLngLat } from '../utils/coordinates';
import type {
  DirectionsOptions,
  DirectionsResult,
  DistanceMatrixOptions,
  DistanceMatrixResult,
  OverviewLevel,
  Route,
  RouteOptimizerOptions,
  RouteOptimizerResult,
  Waypoint,
} from '../types/routing';
import type { LatLngInput } from '../types/common';

const normalizeRoute = (raw: Raw): Route => ({
  distance: asMetric(raw.distance),
  duration: asMetric(raw.duration),
  geometry: asString(raw.geometry),
  legs: arrayOf(raw.legs).map((leg) => ({
    distance: asMetric(leg.distance),
    duration: asMetric(leg.duration),
    summary: asString(leg.summary),
    steps: arrayOf(leg.steps).map((step) => ({
      distance: asMetric(step.distance),
      duration: asMetric(step.duration),
      name: asString(step.name),
      ref: asString(step.ref),
      maneuver: asString(step.maneuver),
      location: asLngLat(step.location),
      geometry: asString(step.geometry),
    })),
  })),
});

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

/**
 * Routing API: directions, distance matrix and route optimization across
 * Ola Maps and Mappls.
 */
export class RoutingApi extends BaseApi {
  /**
   * Returns routes from `origin` to `destination`, optionally through
   * `waypoints`.
   *
   * @throws {@linkcode IndiaMapsError} on configuration, network or API failure.
   */
  async getDirections(
    origin: LatLngInput,
    destination: LatLngInput,
    options?: DirectionsOptions
  ): Promise<DirectionsResult> {
    this.requireAccessToken('RoutingApi.getDirections');
    const coords = [origin, ...(options?.waypoints ?? []), destination];
    const geopositions = joinLngLat(coords);
    const mode = options?.mode ?? 'driving';

    if (this.provider === 'mappls') {
      const resource = options?.trafficMetadata
        ? 'route_traffic'
        : (options?.resource ?? 'route_adv');
      const response = await this.request<Raw>(
        `/route/direction/${resource}/${mode}/${geopositions}`,
        {
          params: {
            alternatives: options?.alternatives,
            steps: options?.steps,
            overview: serializeOverview(options?.overview),
            geometries: options?.geometries,
          },
        },
        this.routeTarget
      );
      return normalizeDirections(response);
    }

    const response = await this.request<Raw>(
      `/routing/v1/directions/${mode}/${geopositions}`,
      {
        params: {
          alternatives: options?.alternatives,
          steps: options?.steps,
          overview: serializeOverview(options?.overview),
          geometries: options?.geometries,
          traffic_metadata: options?.trafficMetadata,
          route_preference: options?.routePreference,
          language: options?.language,
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
   * @throws {@linkcode IndiaMapsError} on configuration, network or API failure.
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
        `/route/dm/${resource}/${mode}/${geopositions}`,
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
      `/routing/v1/distanceMatrix/${mode}`,
      {
        params: {
          origins: joinLngLat(origins, '|'),
          destinations: joinLngLat(destinations, '|'),
          route_preference: options?.routePreference,
          language: options?.language,
        },
      },
      this.routeTarget
    );
    return normalizeDistanceMatrix(response);
  }

  /**
   * Optimizes the visiting order of `locations`.
   *
   * @throws {@linkcode IndiaMapsError} on configuration, network or API failure.
   */
  async routeOptimizer(
    locations: LatLngInput[],
    options?: RouteOptimizerOptions
  ): Promise<RouteOptimizerResult> {
    this.requireAccessToken('RoutingApi.routeOptimizer');
    const mode = options?.mode ?? 'driving';
    const geopositions = joinLngLat(locations);

    if (this.provider === 'mappls') {
      const resource = options?.resource ?? 'trip_optimization_eta';
      const response = await this.request<Raw>(
        `/route/optimization/${resource}/${mode}/${geopositions}`,
        {
          params: {
            source: options?.source,
            destination: options?.destination,
            roundtrip: options?.roundTrip,
            steps: options?.steps,
            overview: serializeOverview(options?.overview),
          },
        },
        this.routeTarget
      );
      return normalizeRouteOptimizer(response);
    }

    const response = await this.request<Raw>(
      `/routing/v1/routeOptimizer/${mode}/${geopositions}`,
      {
        params: {
          source: options?.source,
          destination: options?.destination,
          roundtrip: options?.roundTrip,
          steps: options?.steps,
          overview: serializeOverview(options?.overview),
          traffic_metadata: options?.trafficMetadata,
          route_preference: options?.routePreference,
          language: options?.language,
        },
      },
      this.routeTarget
    );
    return normalizeRouteOptimizer(response);
  }
}

const serializeOverview = (overview?: OverviewLevel): string | boolean =>
  overview === undefined ? true : overview;

const normalizeDirections = (response: unknown): DirectionsResult => {
  const raw = (response ?? {}) as Raw;
  return {
    code: asString(raw.code),
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
  return {
    code: asString(raw.code),
    order: Array.isArray(raw.order)
      ? raw.order.map((value) => asNumber(value) ?? 0)
      : undefined,
    routes: arrayOf(raw.routes ?? raw.trips).map(normalizeRoute),
    waypoints: arrayOf(raw.waypoints).map(normalizeWaypoint),
    distance: asMetric(raw.distance),
    duration: asMetric(raw.duration),
  };
};
