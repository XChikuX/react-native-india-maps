import { IndiaMapsClient, IndiaMapsError } from '../index';

const jsonResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  headers: { get: () => 'application/json' },
  json: jest.fn().mockResolvedValue(body),
  text: jest.fn().mockResolvedValue(JSON.stringify(body)),
});

const g = globalThis as unknown as { fetch: jest.Mock };

describe('API endpoint construction (Ola Maps)', () => {
  let client: IndiaMapsClient;

  beforeEach(() => {
    client = new IndiaMapsClient({ accessToken: 'test-token' });
    g.fetch = jest.fn().mockResolvedValue(jsonResponse({ results: [] }));
  });

  it('uses Ola elevation endpoint', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        results: [
          { elevation: 830, location: { latitude: 12.9, longitude: 77.6 } },
        ],
      })
    );
    await client.elevation.getElevation(12.9, 77.6);
    expect(g.fetch).toHaveBeenCalled();
    const url = (g.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('/elevation/v1/getElevation');
    expect(url).toContain('locations=12.9%2C77.6');
    expect(url).toContain('api_key=test-token');
  });

  it('uses Ola route optimizer endpoint', async () => {
    await client.routing.routeOptimizer(['12.9,77.6', '13.05,77.7']);
    const url = (g.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain(
      '/routing/v1/routeOptimizer/driving/77.6,12.9;77.7,13.05'
    );
    expect(url).toContain('api_key=test-token');
  });

  it('uses Ola snap to road endpoint', async () => {
    await client.roads.snapToRoad([{ latitude: 12.9, longitude: 77.6 }], true);
    const url = (g.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('/routing/v1/snapToRoad');
    expect(url).toContain('points=12.9%2C77.6');
  });

  it('uses Ola directions endpoint with waypoint order preserved', async () => {
    await client.routing.getDirections('12.9,77.6', '13.05,77.7');
    const url = (g.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain(
      '/routing/v1/directions/driving/77.6,12.9;77.7,13.05'
    );
    expect(url).toContain('api_key=test-token');
  });

  it('uses Ola autocomplete endpoint', async () => {
    g.fetch = jest.fn().mockResolvedValue(jsonResponse({ predictions: [] }));
    await client.places.autocomplete('bangalore');
    const url = (g.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('/places/v1/autocomplete');
    expect(url).toContain('input=bangalore');
    expect(url).toContain('api_key=test-token');
  });

  it('throws a configuration error without a token', async () => {
    const anonymous = new IndiaMapsClient();
    await expect(anonymous.places.autocomplete('bangalore')).rejects.toThrow(
      IndiaMapsError
    );
  });
});

describe('API endpoint construction (Mappls)', () => {
  let client: IndiaMapsClient;

  beforeEach(() => {
    client = new IndiaMapsClient({
      accessToken: 'test-token',
      provider: 'mappls',
    });
    g.fetch = jest.fn().mockResolvedValue(jsonResponse({ results: [] }));
  });

  it('uses Mappls elevation endpoint', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        results: [
          { elevation: 830, location: { latitude: 12.9, longitude: 77.6 } },
        ],
      })
    );
    await client.elevation.getElevation(12.9, 77.6);
    const url = (g.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('https://sdk.mappls.com/map/utils/elevation');
    expect(url).toContain('locations=12.9%2C77.6');
  });

  it('uses Mappls autosuggest endpoint', async () => {
    g.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse({ suggestedLocations: [] }));
    await client.places.autocomplete('delhi');
    const url = (g.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain(
      'https://search.mappls.com/search/places/autosuggest/json'
    );
    expect(url).toContain('query=delhi');
    expect(url).toContain('access_token=test-token');
  });

  it('rejects geofencing with an unsupported error', async () => {
    await expect(client.geofencing.list('project-1')).rejects.toThrow(
      expect.objectContaining({ code: 'UNSUPPORTED_ERROR' })
    );
  });

  it('rejects speed limits with an unsupported error', async () => {
    await expect(
      client.roads.speedLimits([{ latitude: 12.9, longitude: 77.6 }])
    ).rejects.toThrow(expect.objectContaining({ code: 'UNSUPPORTED_ERROR' }));
  });
});

describe('Response normalization (Ola Maps)', () => {
  let client: IndiaMapsClient;

  beforeEach(() => {
    client = new IndiaMapsClient({ accessToken: 'test-token' });
    g.fetch = jest.fn().mockResolvedValue(jsonResponse({ results: [] }));
  });

  it('normalizes autocomplete predictions', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        predictions: [
          {
            place_id: 'p1',
            description: 'Kempegowda Airport, Devanahalli',
            structuredFormatting: {
              mainText: 'Kempegowda Airport',
              secondaryText: 'Devanahalli',
            },
            distanceMeters: 1200,
          },
        ],
      })
    );

    const suggestions = await client.places.autocomplete('kempe');
    expect(suggestions[0]).toMatchObject({
      placeId: 'p1',
      name: 'Kempegowda Airport',
      address: 'Devanahalli',
      distanceMeters: 1200,
    });
  });

  it('normalizes geocoding results', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        geocodingResults: [
          {
            place_id: 'p2',
            formatted_address: 'Mumbai, Maharashtra',
            geometry: { location: { lat: 19.076, lng: 72.8777 } },
          },
        ],
      })
    );

    const results = await client.places.geocode('Mumbai');
    expect(results[0]).toEqual({
      placeId: 'p2',
      formattedAddress: 'Mumbai, Maharashtra',
      location: { lat: 19.076, lng: 72.8777 },
    });
  });

  it('normalizes directions routes and steps', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        code: 'Ok',
        routes: [
          {
            distance: 1000,
            duration: 300,
            legs: [
              {
                distance: 1000,
                duration: 300,
                steps: [{ distance: 500, duration: 150, name: 'Bellary Road' }],
              },
            ],
          },
        ],
        waypoints: [{ location: [77.6, 12.9] }],
      })
    );

    const result = await client.routing.getDirections('12.9,77.6', '13.0,77.7');
    expect(result.code).toBe('Ok');
    expect(result.routes).toHaveLength(1);
    expect(result.routes[0]?.distance).toBe(1000);
    expect(result.routes[0]?.legs?.[0]?.steps?.[0]?.name).toBe('Bellary Road');
    expect(result.waypoints?.[0]?.location).toEqual([77.6, 12.9]);
  });

  it('normalizes Ola distance matrix cells into grids', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        distanceMatrix: [
          {
            distanceMatrixCells: [
              { distance: { value: 8500 }, duration: { value: 1200 } },
            ],
          },
        ],
      })
    );

    const result = await client.routing.getDistanceMatrix(
      ['12.9,77.6'],
      ['13.0,77.7']
    );
    expect(result.distances).toEqual([[8500]]);
    expect(result.durations).toEqual([[1200]]);
  });

  it('normalizes elevation results', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        results: [
          {
            elevation: 920,
            location: { lat: 12.9, lng: 77.6 },
            resolution: 76,
          },
        ],
      })
    );

    const elevation = await client.elevation.getElevation(12.9, 77.6);
    expect(elevation.elevation).toBe(920);
    expect(elevation.location).toEqual({ lat: 12.9, lng: 77.6 });
  });

  it('normalizes snapped points', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        snappedPoints: [
          {
            location: { latitude: 12.9, longitude: 77.6 },
            originalIndex: 0,
            placeId: 'road-1',
          },
        ],
      })
    );

    const result = await client.roads.snapToRoad([
      { latitude: 12.9, longitude: 77.6 },
    ]);
    expect(result.snappedPoints[0]).toEqual({
      location: { latitude: 12.9, longitude: 77.6 },
      originalIndex: 0,
      placeId: 'road-1',
    });
  });

  it('validates addresses from the first geocode match', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        geocodingResults: [
          { place_id: 'p3', formatted_address: 'Pune, Maharashtra' },
        ],
      })
    );

    const match = await client.places.addressValidation('Pune');
    expect(match?.formattedAddress).toBe('Pune, Maharashtra');
  });

  it('wraps network failures in IndiaMapsError', async () => {
    g.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError('Network request failed'));
    await expect(client.places.geocode('Mumbai')).rejects.toThrow(
      expect.objectContaining({ code: 'NETWORK_ERROR' })
    );
  });

  it('wraps API failures in IndiaMapsError with status', async () => {
    g.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => 'application/json' },
      json: jest.fn().mockResolvedValue({ error: 'unauthorized' }),
    });
    await expect(client.places.geocode('Mumbai')).rejects.toThrow(
      expect.objectContaining({ code: 'API_ERROR', status: 401 })
    );
  });
});

describe('Response normalization (Mappls)', () => {
  let client: IndiaMapsClient;

  beforeEach(() => {
    client = new IndiaMapsClient({
      accessToken: 'test-token',
      provider: 'mappls',
    });
    g.fetch = jest.fn().mockResolvedValue(jsonResponse({ results: [] }));
  });

  it('normalizes autosuggest locations', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        suggestedLocations: [
          {
            eLoc: 'MMI000',
            placeName: 'MapmyIndia Head Office',
            placeAddress: 'Okhla Industrial Estate Phase 3, New Delhi',
            distance: 9101,
            type: 'POI',
          },
        ],
      })
    );

    const suggestions = await client.places.autocomplete('mapmyindia');
    expect(suggestions[0]).toMatchObject({
      placeId: 'MMI000',
      name: 'MapmyIndia Head Office',
      address: 'Okhla Industrial Estate Phase 3, New Delhi',
      distanceMeters: 9101,
      types: ['POI'],
    });
  });

  it('normalizes OSRM-style distance matrix grids', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        code: 'Ok',
        distances: [[100, 200]],
        durations: [[60, 120]],
      })
    );

    const result = await client.routing.getDistanceMatrix(
      ['12.9,77.6'],
      ['13.0,77.7', '13.1,77.8']
    );
    expect(result.distances).toEqual([[100, 200]]);
    expect(result.durations).toEqual([[60, 120]]);
  });
});
