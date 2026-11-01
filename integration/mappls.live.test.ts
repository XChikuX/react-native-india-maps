/**
 * Live integration tests against the real Mappls API
 * (https://search.mappls.com and friends).
 *
 * Skipped unless `MAPPLS_ACCESS_TOKEN` is set:
 *
 *   MAPPLS_ACCESS_TOKEN=your-token bun run test:integration
 */
import { IndiaMapsClient } from '../src/IndiaMapsClient';

const ACCESS_TOKEN = process.env.MAPPLS_ACCESS_TOKEN;
const describeMappls = ACCESS_TOKEN ? describe : describe.skip;

describeMappls('Mappls live API', () => {
  const client = new IndiaMapsClient({
    provider: 'mappls',
    accessToken: ACCESS_TOKEN,
  });

  it('returns autosuggest results', async () => {
    const suggestions = await client.places.autocomplete('koramangala');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]?.name ?? '').not.toBe('');
  });

  it('geocodes an address', async () => {
    const results = await client.places.geocode('MG Road, Bengaluru');
    expect(results.length).toBeGreaterThan(0);
    expect(Number.isFinite(results[0]?.location?.lat)).toBe(true);
  });

  it('reverse geocodes a coordinate', async () => {
    const results = await client.places.reverseGeocode('12.9716,77.5946');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.formattedAddress ?? '').not.toBe('');
  });

  it('returns driving directions', async () => {
    const result = await client.routing.getDirections(
      { latitude: 12.9716, longitude: 77.5946 },
      { latitude: 12.9352, longitude: 77.6245 },
      { mode: 'driving' }
    );
    expect(result.routes.length).toBeGreaterThan(0);
    expect(result.routes[0]?.distance ?? 0).toBeGreaterThan(0);
    expect(result.routes[0]?.duration ?? 0).toBeGreaterThan(0);
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

  it('returns an elevation', async () => {
    const result = await client.elevation.getElevation({
      latitude: 34.1526,
      longitude: 77.5771,
    });
    expect(Number.isFinite(result.elevation)).toBe(true);
    expect(result.elevation).toBeGreaterThan(1000);
  });

  it('builds an authenticated static map URL', () => {
    const url = new URL(
      client.tiles.getStaticMapURL({
        center: [77.5946, 12.9716],
        height: 320,
        markers: [{ latitude: 12.9716, longitude: 77.5946 }],
        width: 480,
        zoom: 13,
      })
    );

    expect(url.hostname).toBe('tile.mappls.com');
    expect(url.pathname).toBe('/map/raster_tile/still_image');
    expect(url.searchParams.get('access_token')).toBe(ACCESS_TOKEN);
    expect(url.searchParams.get('size')).toBe('480x320');
    expect(url.searchParams.get('zoom')).toBe('13');
  });
});
