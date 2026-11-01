/**
 * Live integration tests against the real Ola Maps API
 * (https://api.olamaps.io).
 *
 * Skipped unless `OLA_MAPS_API_KEY` is set:
 *
 *   OLA_MAPS_API_KEY=your-key bun run test:integration
 *
 * The geofencing round-trip creates and deletes a real geofence in your
 * account; opt in explicitly with `OLA_MAPS_GEOFENCE_TESTS=1`.
 */
import { IndiaMapsClient } from '../src/IndiaMapsClient';

const API_KEY = process.env.OLA_MAPS_API_KEY;
const RUN_GEOFENCE_ROUND_TRIP =
  process.env.OLA_MAPS_GEOFENCE_TESTS === '1' && Boolean(API_KEY);

const describeOla = API_KEY ? describe : describe.skip;
const describeGeofencing = RUN_GEOFENCE_ROUND_TRIP ? describe : describe.skip;

const GEOFENCE_PROJECT_ID = 'react-native-india-maps-integration';

describeOla('Ola Maps live API', () => {
  const client = new IndiaMapsClient({ apiKey: API_KEY });

  it('geocodes an address', async () => {
    const results = await client.places.geocode('Cubbon Park, Bengaluru');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.formattedAddress ?? '').not.toBe('');
    expect(Number.isFinite(results[0]?.location?.lat)).toBe(true);
    expect(Number.isFinite(results[0]?.location?.lng)).toBe(true);
  });

  it('returns autocomplete suggestions', async () => {
    const suggestions = await client.places.autocomplete('koramangala');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]?.name ?? '').not.toBe('');
  });

  it('reverse geocodes a coordinate', async () => {
    const results = await client.places.reverseGeocode('12.9716,77.5946');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.formattedAddress ?? '').not.toBe('');
  });

  it('runs a text search', async () => {
    const results = await client.places.textSearch('coffee shop koramangala');
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns driving directions with geometry', async () => {
    const result = await client.routing.getDirections(
      '12.9716,77.5946',
      '12.9352,77.6245',
      { mode: 'driving' }
    );
    expect(result.routes.length).toBeGreaterThan(0);
    expect(result.routes[0]?.distance ?? 0).toBeGreaterThan(0);
    expect(result.routes[0]?.duration ?? 0).toBeGreaterThan(0);
    expect(result.routes[0]?.geometry ?? '').not.toBe('');
    expect(result.waypoints?.length).toBe(2);
  });

  it('computes a distance matrix', async () => {
    const result = await client.routing.getDistanceMatrix(
      ['12.9716,77.5946'],
      ['12.9352,77.6245', '12.9784,77.6408'],
      { mode: 'driving' }
    );
    expect(result.distances).toHaveLength(1);
    expect(result.distances[0]).toHaveLength(2);
    expect(result.distances[0]?.[0] ?? 0).toBeGreaterThan(0);
    expect(result.durations[0]?.[0] ?? 0).toBeGreaterThan(0);
  });

  it('snaps GPS points to the road network', async () => {
    const result = await client.roads.snapToRoad([
      { latitude: 12.9756, longitude: 77.5993 },
      { latitude: 12.9727, longitude: 77.6108 },
    ]);
    expect(result.snappedPoints.length).toBeGreaterThan(0);
    for (const point of result.snappedPoints) {
      expect(Number.isFinite(point.location.latitude)).toBe(true);
      expect(Number.isFinite(point.location.longitude)).toBe(true);
    }
  });

  it('returns the elevation of a high-altitude point', async () => {
    const result = await client.elevation.getElevation({
      latitude: 34.1526,
      longitude: 77.5771,
    });
    expect(result.elevation).toBeGreaterThan(1000);
  });

  it('returns multi-point elevations in input order', async () => {
    const result = await client.elevation.getMultiElevation([
      { latitude: 34.1526, longitude: 77.5771 },
      { latitude: 12.9716, longitude: 77.5946 },
      { latitude: 28.6139, longitude: 77.209 },
    ]);
    expect(result.results).toHaveLength(3);
    expect(result.results[0]?.elevation).toBeGreaterThan(1000);
  });

  it('serves a valid MapLibre style document for the style URL', async () => {
    const styleUrl = client.tiles.getStyleURL();
    expect(styleUrl).toContain('api_key=');

    const response = await fetch(styleUrl);
    expect(response.ok).toBe(true);

    const style = (await response.json()) as {
      version?: number;
      layers?: unknown[];
    };
    expect(style.version).toBeDefined();
    expect(Array.isArray(style.layers)).toBe(true);
  });
});

describeGeofencing('Ola Maps live geofencing round trip', () => {
  const client = new IndiaMapsClient({ apiKey: API_KEY });
  let fenceId: string | undefined;

  afterAll(async () => {
    if (fenceId) {
      await client.geofencing.deleteById(fenceId).catch(() => undefined);
    }
  });

  it('creates, reads, checks, lists and deletes a geofence', async () => {
    const created = await client.geofencing.create({
      name: `integration-${Date.now()}`,
      projectId: GEOFENCE_PROJECT_ID,
      geometry: {
        type: 'circle',
        center: { lat: 12.9716, lng: 77.5946 },
        radius: 500,
      },
    });
    fenceId = created.fenceId;
    expect(created.fenceId).not.toBe('');

    const fence = await client.geofencing.getById(fenceId);
    expect(fence.geometry.type).toBe('circle');
    expect(fence.projectId).toBe(GEOFENCE_PROJECT_ID);

    const inside = await client.geofencing.checkStatus(fenceId, {
      lat: 12.9716,
      lng: 77.5946,
    });
    expect(inside.isInside).toBe(true);

    const page = await client.geofencing.list(GEOFENCE_PROJECT_ID);
    expect(page.fences.some((entry) => entry.fenceId === fenceId)).toBe(true);

    await client.geofencing.deleteById(fenceId);
    await expect(client.geofencing.getById(fenceId)).rejects.toMatchObject({
      code: 'API_ERROR',
    });
    fenceId = undefined;
  });
});
