/**
 * Integration tests for the HTTP pipeline against a real in-process HTTP
 * server: URL building, credential injection, JSON body serialization, header
 * handling, response normalization and error mapping all run end-to-end with
 * real `fetch` — no mocks.
 *
 * These tests require no credentials and no outbound network access.
 */
import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { IndiaMapsClient } from '../src/IndiaMapsClient';

type CapturedRequest = {
  method: string;
  pathname: string;
  searchParams: URLSearchParams;
  headers: IncomingMessage['headers'];
  body?: string;
};

/** One captured request per hit; reset in `beforeEach`. */
const captured: CapturedRequest[] = [];

/** Route table: `METHOD /path` → JSON payload. */
const routes = new Map<string, { status: number; payload: unknown }>();

let server: Server;

const respond = (
  method: string,
  path: string,
  payload: unknown,
  status = 200
): void => {
  routes.set(`${method} ${path}`, { status, payload });
};

const lastRequest = (): CapturedRequest => {
  const request = captured[captured.length - 1];
  if (!request) {
    throw new Error('No request was captured.');
  }
  return request;
};

const baseUrl = (): string =>
  `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

beforeAll((done) => {
  server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      captured.push({
        method: req.method ?? 'GET',
        pathname: url.pathname,
        searchParams: url.searchParams,
        headers: req.headers,
        body:
          chunks.length > 0
            ? Buffer.concat(chunks).toString('utf8')
            : undefined,
      });

      const route = routes.get(`${req.method} ${url.pathname}`);
      res.writeHead(route?.status ?? 404, {
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify(route?.payload ?? { error: 'no route' }));
    });
  });
  server.listen(0, '127.0.0.1', done);
});

afterAll((done) => {
  server.closeAllConnections?.();
  server.close(() => done());
});

beforeEach(() => {
  captured.length = 0;
});

describe('local server integration (Ola Maps provider)', () => {
  let client: IndiaMapsClient;

  beforeAll(() => {
    client = new IndiaMapsClient({
      apiKey: 'ola-test-key',
      baseUrl: baseUrl(),
    });
  });

  it('sends an authenticated GET with SDK headers and normalizes geocode results', async () => {
    respond('GET', '/places/v1/geocode', {
      geocodingResults: [
        {
          place_id: 'abc123',
          formatted_address: 'Bengaluru, Karnataka, India',
          geometry: { location: { lat: 12.9716, lng: 77.5946 } },
        },
      ],
    });

    const results = await client.places.geocode('Bengaluru');

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      placeId: 'abc123',
      formattedAddress: 'Bengaluru, Karnataka, India',
      location: { lat: 12.9716, lng: 77.5946 },
    });

    const request = lastRequest();
    expect(request.method).toBe('GET');
    expect(request.pathname).toBe('/places/v1/geocode');
    expect(request.searchParams.get('address')).toBe('Bengaluru');
    expect(request.searchParams.get('api_key')).toBe('ola-test-key');
    expect(request.headers.accept).toBe('application/json');
    expect(request.headers['x-indiamaps-rn-sdk-version']).toBeDefined();
    expect(request.body).toBeUndefined();
  });

  it('serializes multi-elevation POST bodies as JSON and normalizes results', async () => {
    respond('POST', '/places/v1/elevation', {
      results: [
        { elevation: 830, location: { latitude: 12.9, longitude: 77.6 } },
        { elevation: 920, location: { latitude: 13.05, longitude: 77.7 } },
      ],
    });

    const result = await client.elevation.getMultiElevation([
      { lat: 12.9, lng: 77.6 },
      '13.05,77.7',
    ]);

    expect(result.results.map((entry) => entry.elevation)).toEqual([830, 920]);

    const request = lastRequest();
    expect(request.method).toBe('POST');
    expect(request.pathname).toBe('/places/v1/elevation');
    expect(request.headers['content-type']).toBe('application/json');
    expect(JSON.parse(request.body ?? '{}')).toEqual({
      locations: ['12.9,77.6', '13.05,77.7'],
    });
    expect(request.searchParams.get('api_key')).toBe('ola-test-key');
  });

  it('POSTs Ola directions with coordinates in the query string', async () => {
    respond('POST', '/routing/v1/directions', {
      code: 'Ok',
      routes: [
        {
          distance: 5400,
          duration: 780,
          geometry: '_p~iF~ps|U_ulLnnqC',
          legs: [],
        },
      ],
      waypoints: [{ location: [77.5946, 12.9716], name: 'MG Road' }],
    });

    const result = await client.routing.getDirections(
      '12.9716,77.5946',
      '12.9352,77.6245',
      { mode: 'driving' }
    );

    expect(result.code).toBe('Ok');
    expect(result.routes[0]).toMatchObject({
      distance: 5400,
      duration: 780,
      geometry: '_p~iF~ps|U_ulLnnqC',
    });
    expect(result.waypoints?.[0]?.location).toEqual([77.5946, 12.9716]);

    const request = lastRequest();
    expect(request.method).toBe('POST');
    expect(request.pathname).toBe('/routing/v1/directions');
    expect(request.searchParams.get('origin')).toBe('12.9716,77.5946');
    expect(request.searchParams.get('destination')).toBe('12.9352,77.6245');
    expect(request.searchParams.get('mode')).toBe('driving');
    expect(request.searchParams.get('api_key')).toBe('ola-test-key');
  });

  it('performs a geofencing create/delete round trip with the wire payload', async () => {
    respond('POST', '/places/v1/geofence', {
      geofenceId: 'fence-1',
      message: 'Geofence created successfully',
    });
    respond('DELETE', '/places/v1/geofence/fence-1', {
      geofenceId: 'fence-1',
      message: 'Geofence deleted successfully',
    });

    const created = await client.geofencing.create({
      name: 'Demo',
      projectId: 'proj-1',
      geometry: {
        type: 'circle',
        center: { lat: 12.9716, lng: 77.5946 },
        radius: 500,
      },
    });

    expect(created).toEqual({
      fenceId: 'fence-1',
      message: 'Geofence created successfully',
    });

    const createRequest = lastRequest();
    expect(createRequest.method).toBe('POST');
    expect(createRequest.pathname).toBe('/places/v1/geofence');
    expect(JSON.parse(createRequest.body ?? '{}')).toEqual({
      name: 'Demo',
      status: 'active',
      projectId: 'proj-1',
      type: 'circle',
      radius: 500,
      coordinates: [[12.9716, 77.5946]],
    });

    await client.geofencing.deleteById('fence-1');

    const deleteRequest = lastRequest();
    expect(deleteRequest.method).toBe('DELETE');
    expect(deleteRequest.pathname).toBe('/places/v1/geofence/fence-1');
  });

  it('maps non-2xx provider responses to IndiaMapsError API_ERROR', async () => {
    respond(
      'GET',
      '/places/v1/geocode',
      { error: { message: 'Invalid API key' } },
      400
    );

    await expect(client.places.geocode('Bengaluru')).rejects.toMatchObject({
      name: 'IndiaMapsError',
      code: 'API_ERROR',
      status: 400,
      response: { error: { message: 'Invalid API key' } },
    });
  });

  it('maps connection failures to IndiaMapsError NETWORK_ERROR', async () => {
    const deadClient = new IndiaMapsClient({
      apiKey: 'ola-test-key',
      // Port 1 on loopback refuses connections immediately.
      baseUrl: 'http://127.0.0.1:1',
    });

    await expect(deadClient.places.geocode('Bengaluru')).rejects.toMatchObject({
      name: 'IndiaMapsError',
      code: 'NETWORK_ERROR',
    });
  });
});

describe('local server integration (Mappls provider)', () => {
  it('authenticates autosuggest with access_token and normalizes suggestions', async () => {
    respond('GET', '/search/places/autosuggest/json', {
      suggestedLocations: [
        {
          eLoc: 'KORMG',
          placeName: 'Koramangala',
          placeAddress: 'Bengaluru, Karnataka',
          latitude: 12.9352,
          longitude: 77.6245,
          type: 'LOCALITY',
        },
      ],
    });

    const client = new IndiaMapsClient({
      provider: 'mappls',
      accessToken: 'mappls-token',
      searchBaseUrl: baseUrl(),
    });

    const suggestions = await client.places.autocomplete('koram');

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      placeId: 'KORMG',
      name: 'Koramangala',
      address: 'Bengaluru, Karnataka',
      location: { lat: 12.9352, lng: 77.6245 },
    });

    const request = lastRequest();
    expect(request.pathname).toBe('/search/places/autosuggest/json');
    expect(request.searchParams.get('query')).toBe('koram');
    expect(request.searchParams.get('access_token')).toBe('mappls-token');
    expect(request.searchParams.get('api_key')).toBeNull();
  });

  it('reads place details from the eLoc path', async () => {
    respond('GET', '/apis/O2O/entity/KORMG', {
      eLoc: 'KORMG',
      placeName: 'Koramangala',
      placeAddress: 'Bengaluru, Karnataka',
      latitude: 12.9352,
      longitude: 77.6245,
    });

    const client = new IndiaMapsClient({
      provider: 'mappls',
      accessToken: 'mappls-token',
      searchBaseUrl: baseUrl(),
    });

    const details = await client.places.placeDetails('KORMG');

    expect(details).toMatchObject({
      placeId: 'KORMG',
      name: 'Koramangala',
      formattedAddress: 'Bengaluru, Karnataka',
    });
    expect(lastRequest().pathname).toBe('/apis/O2O/entity/KORMG');
  });

  it('serializes snap points as lng,lat pairs and normalizes array locations', async () => {
    respond('GET', '/route/movement/snapToRoad', {
      results: {
        snappedPoints: [{ location: [77.5946, 12.9716], waypoint_index: 0 }],
      },
    });

    const client = new IndiaMapsClient({
      provider: 'mappls',
      accessToken: 'mappls-token',
      routeBaseUrl: baseUrl(),
    });

    const result = await client.roads.snapToRoad([
      { latitude: 12.9716, longitude: 77.5946 },
    ]);

    expect(result.snappedPoints).toHaveLength(1);
    expect(result.snappedPoints[0]).toMatchObject({
      location: { latitude: 12.9716, longitude: 77.5946 },
      originalIndex: 0,
    });

    const request = lastRequest();
    expect(request.pathname).toBe('/route/movement/snapToRoad');
    expect(request.searchParams.get('pts')).toBe('77.5946,12.9716');
    expect(request.searchParams.get('access_token')).toBe('mappls-token');
  });
});
