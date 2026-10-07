import { IndiaMapsClient } from '../index';

const g = globalThis as unknown as { fetch: jest.Mock };

const jsonResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  headers: { get: () => 'application/json' },
  json: jest.fn().mockResolvedValue(body),
  text: jest.fn().mockResolvedValue(JSON.stringify(body)),
});

/** URL of the most recent request in the current test. */
const requestedUrl = (): string => {
  const calls = (g.fetch as jest.Mock).mock.calls;
  return calls[calls.length - 1]?.[0] as string;
};

const PROXY = 'https://proxy.example.com';

describe('base URL overrides', () => {
  beforeEach(() => {
    g.fetch = jest.fn().mockResolvedValue(jsonResponse({ fences: [] }));
  });

  describe('searchBaseUrl', () => {
    it('routes places autocomplete through the configured search base URL', async () => {
      const client = new IndiaMapsClient({ apiKey: 'k', searchBaseUrl: PROXY });
      await client.places.autocomplete('blr');
      expect(requestedUrl()).toContain(PROXY);
    });

    it('routes geocoding through the configured search base URL', async () => {
      const client = new IndiaMapsClient({ apiKey: 'k', searchBaseUrl: PROXY });
      await client.places.geocode('Bengaluru');
      expect(requestedUrl()).toContain(PROXY);
    });

    it('routes reverse geocoding through the configured search base URL', async () => {
      const client = new IndiaMapsClient({ apiKey: 'k', searchBaseUrl: PROXY });
      await client.places.reverseGeocode('12.9,77.6');
      expect(requestedUrl()).toContain(PROXY);
    });

    it('routes nearby search through the configured search base URL', async () => {
      const client = new IndiaMapsClient({ apiKey: 'k', searchBaseUrl: PROXY });
      await client.places.nearbySearch('12.9,77.6');
      expect(requestedUrl()).toContain(PROXY);
    });

    it('routes place details through the configured search base URL', async () => {
      const client = new IndiaMapsClient({ apiKey: 'k', searchBaseUrl: PROXY });
      await client.places.placeDetails('p1');
      expect(requestedUrl()).toContain(PROXY);
    });

    it('routes Mappls places search through the configured search base URL', async () => {
      const client = new IndiaMapsClient({
        accessToken: 't',
        provider: 'mappls',
        searchBaseUrl: PROXY,
      });
      await client.places.autocomplete('blr');
      expect(requestedUrl()).toContain(PROXY);
    });

    it('leaves routing on the route base URL when only searchBaseUrl is set', async () => {
      const client = new IndiaMapsClient({
        apiKey: 'k',
        searchBaseUrl: PROXY,
        routeBaseUrl: 'https://route.example.com',
      });
      await client.routing.getDirections('12.9,77.6', '13.0,77.7');
      expect(requestedUrl()).toContain('https://route.example.com');
    });
  });

  describe('sdkBaseUrl', () => {
    it('routes geofencing list through the configured SDK base URL', async () => {
      const client = new IndiaMapsClient({ apiKey: 'k', sdkBaseUrl: PROXY });
      await client.geofencing.list('p1');
      expect(requestedUrl()).toContain(PROXY);
    });

    it('routes geofence creation through the configured SDK base URL', async () => {
      g.fetch = jest
        .fn()
        .mockResolvedValue(
          jsonResponse({ geofenceId: 'f1', status: 'created' })
        );
      const client = new IndiaMapsClient({ apiKey: 'k', sdkBaseUrl: PROXY });
      await client.geofencing.create({
        name: 'Depot',
        projectId: 'p1',
        geometry: {
          type: 'circle',
          center: { lat: 12.9, lng: 77.6 },
          radius: 500,
        },
      });
      expect(requestedUrl()).toContain(PROXY);
    });

    it('routes geofence status checks through the configured SDK base URL', async () => {
      const client = new IndiaMapsClient({ apiKey: 'k', sdkBaseUrl: PROXY });
      await client.geofencing
        .checkStatus('f1', { lat: 12.9, lng: 77.6 })
        .catch(() => undefined);
      expect(requestedUrl()).toContain(PROXY);
    });
  });

  describe('tileBaseUrl', () => {
    it('routes static map URLs through the configured tile base URL', () => {
      const client = new IndiaMapsClient({ apiKey: 'k', tileBaseUrl: PROXY });
      const url = client.tiles.getStaticMapURL({
        center: [77.6, 12.9],
        zoom: 12,
        width: 200,
        height: 200,
      });
      expect(url).toContain(PROXY);
    });
  });

  describe('routeBaseUrl', () => {
    it('routes elevation through the configured route base URL', async () => {
      const client = new IndiaMapsClient({
        apiKey: 'k',
        routeBaseUrl: 'https://route.example.com',
      });
      await client.elevation
        .getElevation({ lat: 12.9, lng: 77.6 })
        .catch(() => undefined);
      expect(requestedUrl()).toContain('https://route.example.com');
    });
  });

  describe('baseUrl acts as a global fallback', () => {
    it('redirects places, routing, elevation and geofencing together', async () => {
      const client = new IndiaMapsClient({ apiKey: 'k', baseUrl: PROXY });

      await client.places.autocomplete('blr');
      expect(requestedUrl()).toContain(PROXY);

      await client.routing.getDirections('12.9,77.6', '13.0,77.7');
      expect(requestedUrl()).toContain(PROXY);

      await client.elevation
        .getElevation({ lat: 12.9, lng: 77.6 })
        .catch(() => undefined);
      expect(requestedUrl()).toContain(PROXY);

      await client.geofencing.list('p1');
      expect(requestedUrl()).toContain(PROXY);

      expect(
        client.tiles.getStaticMapURL({
          center: [77.6, 12.9],
          zoom: 12,
          width: 200,
          height: 200,
        })
      ).toContain(PROXY);
    });

    it('lets a domain-specific override win over baseUrl', async () => {
      const client = new IndiaMapsClient({
        apiKey: 'k',
        baseUrl: PROXY,
        searchBaseUrl: 'https://search.example.com',
      });

      await client.places.autocomplete('blr');
      expect(requestedUrl()).toContain('https://search.example.com');

      await client.routing.getDirections('12.9,77.6', '13.0,77.7');
      expect(requestedUrl()).toContain(PROXY);
    });

    it('redirects Mappls routing when only baseUrl is set', async () => {
      const client = new IndiaMapsClient({
        accessToken: 't',
        provider: 'mappls',
        baseUrl: PROXY,
      });
      await client.routing.getDirections('12.9,77.6', '13.0,77.7');
      expect(requestedUrl()).toContain(PROXY);
    });

    it('keeps the Mappls per-capability hosts when nothing is overridden', async () => {
      const client = new IndiaMapsClient({
        accessToken: 't',
        provider: 'mappls',
      });

      await client.places.autocomplete('blr');
      expect(requestedUrl()).toContain('https://search.mappls.com');

      await client.routing.getDirections('12.9,77.6', '13.0,77.7');
      expect(requestedUrl()).toContain('https://route.mappls.com');
    });
  });

  describe('provider defaults are unchanged', () => {
    it('keeps Ola Maps places on the public API host', async () => {
      const client = new IndiaMapsClient({ apiKey: 'k' });
      await client.places.autocomplete('blr');
      expect(requestedUrl()).toContain('https://api.olamaps.io');
    });

    it('keeps Ola Maps geofencing on the public API host', async () => {
      const client = new IndiaMapsClient({ apiKey: 'k' });
      await client.geofencing.list('p1');
      expect(requestedUrl()).toContain('https://api.olamaps.io');
    });

    it('keeps Mappls places on search.mappls.com', async () => {
      const client = new IndiaMapsClient({
        accessToken: 't',
        provider: 'mappls',
      });
      await client.places.autocomplete('blr');
      expect(requestedUrl()).toContain('https://search.mappls.com');
    });
  });
});
