import { IndiaMapsClient, IndiaMapsError } from '../index';

const jsonResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  headers: { get: () => 'application/json' },
  json: jest.fn().mockResolvedValue(body),
  text: jest.fn().mockResolvedValue(JSON.stringify(body)),
});

const g = globalThis as unknown as { fetch: jest.Mock };

/** URL of the most recent request in the current test. */
const requestedUrl = (): string => {
  const calls = (g.fetch as jest.Mock).mock.calls;
  return calls[calls.length - 1]?.[0] as string;
};

/** Init object of the most recent request in the current test. */
const lastRequestInit = (): Record<string, unknown> => {
  const calls = (g.fetch as jest.Mock).mock.calls;
  return (calls[calls.length - 1]?.[1] ?? {}) as Record<string, unknown>;
};

describe('API endpoint construction (Ola Maps)', () => {
  let client: IndiaMapsClient;

  beforeEach(() => {
    client = new IndiaMapsClient({ accessToken: 'test-token' });
    g.fetch = jest.fn().mockResolvedValue(jsonResponse({ results: [] }));
  });

  it('uses the Ola single-elevation endpoint', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        results: [
          { elevation: 830, location: { latitude: 12.9, longitude: 77.6 } },
        ],
      })
    );
    await client.elevation.getElevation({ lat: 12.9, lng: 77.6 });
    expect(requestedUrl()).toContain(
      'https://api.olamaps.io/places/v1/elevation'
    );
    expect(requestedUrl()).toContain('location=12.9%2C77.6');
    expect(requestedUrl()).toContain('api_key=test-token');
    expect(lastRequestInit().method).toBeUndefined();
  });

  it('uses the Ola multi-elevation endpoint with a JSON body', async () => {
    await client.elevation.getMultiElevation([
      { lat: 12.9, lng: 77.6 },
      '13.05,77.7',
    ]);
    expect(requestedUrl()).toContain(
      'https://api.olamaps.io/places/v1/elevation'
    );
    expect(lastRequestInit().method).toBe('POST');
    expect(lastRequestInit().body).toBe(
      JSON.stringify({ locations: ['12.9,77.6', '13.05,77.7'] })
    );
  });

  it('rejects more than 25 elevation coordinates', async () => {
    const points = Array.from({ length: 26 }, (_, i) => ({
      lat: 12.9 + i / 100,
      lng: 77.6,
    }));
    await expect(client.elevation.getMultiElevation(points)).rejects.toThrow(
      expect.objectContaining({ code: 'INVALID_INPUT_ERROR' })
    );
  });

  it('posts to the Ola route optimizer endpoint', async () => {
    await client.routing.routeOptimizer(['12.9,77.6', '13.05,77.7'], {
      roundTrip: true,
    });
    expect(requestedUrl()).toContain(
      'https://api.olamaps.io/routing/v1/routeOptimizer'
    );
    expect(requestedUrl()).toContain('locations=12.9%2C77.6%7C13.05%2C77.7');
    expect(requestedUrl()).toContain('round_trip=true');
    expect(requestedUrl()).toContain('mode=driving');
    expect(requestedUrl()).toContain('api_key=test-token');
    expect(lastRequestInit().method).toBe('POST');
  });

  it('rejects an unsupported optimizer destination anchor', async () => {
    await expect(
      client.routing.routeOptimizer(['12.9,77.6', '13.05,77.7'], {
        destination: 'first',
      })
    ).rejects.toThrow(expect.objectContaining({ code: 'INVALID_INPUT_ERROR' }));
  });

  it('uses the Ola snap to road endpoint with enhancePath', async () => {
    await client.roads.snapToRoad([{ latitude: 12.9, longitude: 77.6 }], true);
    expect(requestedUrl()).toContain('/routing/v1/snapToRoad');
    expect(requestedUrl()).toContain('points=12.9%2C77.6');
    expect(requestedUrl()).toContain('enhancePath=true');
  });

  it('uses the Ola nearest roads endpoint with a validation mode', async () => {
    await client.roads.nearestRoads([{ latitude: 12.9, longitude: 77.6 }], {
      mode: 'biking',
      radius: 250,
    });
    expect(requestedUrl()).toContain('/routing/v1/nearestRoads');
    expect(requestedUrl()).toContain('points=12.9%2C77.6');
    expect(requestedUrl()).toContain('mode=BICYCLING');
    expect(requestedUrl()).toContain('radius=250');
  });

  it('maps the speed limit snap strategy', async () => {
    await client.roads.speedLimits([{ latitude: 12.9, longitude: 77.6 }], {
      snapStrategy: 'nearest-road',
    });
    expect(requestedUrl()).toContain('/routing/v1/speedLimits');
    expect(requestedUrl()).toContain('snapStrategy=nearestroad');
  });

  it('posts to the Ola directions endpoint', async () => {
    await client.routing.getDirections('12.9,77.6', '13.05,77.7');
    expect(requestedUrl()).toContain(
      'https://api.olamaps.io/routing/v1/directions'
    );
    expect(requestedUrl()).toContain('origin=12.9%2C77.6');
    expect(requestedUrl()).toContain('destination=13.05%2C77.7');
    expect(requestedUrl()).toContain('mode=driving');
    expect(requestedUrl()).toContain('api_key=test-token');
    expect(lastRequestInit().method).toBe('POST');
  });

  it('sends waypoints pipe-separated in lat,lng order', async () => {
    await client.routing.getDirections('12.9,77.6', '13.2,77.9', {
      waypoints: ['13.0,77.7', '13.1,77.8'],
    });
    expect(requestedUrl()).toContain('waypoints=13.0%2C77.7%7C13.1%2C77.8');
  });

  it('rejects trucking on Ola routing', async () => {
    await expect(
      client.routing.getDirections('12.9,77.6', '13.0,77.7', {
        mode: 'trucking',
      })
    ).rejects.toThrow(expect.objectContaining({ code: 'UNSUPPORTED_ERROR' }));
  });

  it('uses the Ola distance matrix endpoint', async () => {
    await client.routing.getDistanceMatrix(['12.9,77.6'], ['13.0,77.7'], {
      routePreference: 'shortest',
    });
    expect(requestedUrl()).toContain(
      'https://api.olamaps.io/routing/v1/distanceMatrix'
    );
    expect(requestedUrl()).toContain('origins=12.9%2C77.6');
    expect(requestedUrl()).toContain('destinations=13.0%2C77.7');
    expect(requestedUrl()).toContain('route_preference=shortest');
  });

  it('uses the Ola autocomplete endpoint', async () => {
    g.fetch = jest.fn().mockResolvedValue(jsonResponse({ predictions: [] }));
    await client.places.autocomplete('bangalore');
    expect(requestedUrl()).toContain('/places/v1/autocomplete');
    expect(requestedUrl()).toContain('input=bangalore');
    expect(requestedUrl()).toContain('api_key=test-token');
  });

  it('uses the Ola nearby search ranking and limit params', async () => {
    g.fetch = jest.fn().mockResolvedValue(jsonResponse({ predictions: [] }));
    await client.places.nearbySearch('12.9,77.6', {
      rankBy: 'distance',
      limit: 20,
      withCentroid: true,
    });
    expect(requestedUrl()).toContain('/places/v1/nearbysearch');
    expect(requestedUrl()).toContain('rankBy=distance');
    expect(requestedUrl()).toContain('limit=20');
    expect(requestedUrl()).toContain('withCentroid=true');
  });

  it('uses the Ola address validation endpoint', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        result: {
          validated: true,
          validated_address: 'Pune, Maharashtra',
        },
        status: 'validation_done',
      })
    );
    const match = await client.places.addressValidation('Pune');
    expect(requestedUrl()).toContain('/places/v1/addressvalidation');
    expect(requestedUrl()).toContain('address=Pune');
    expect(match).toEqual({
      isAddressValid: true,
      validatedAddress: 'Pune, Maharashtra',
    });
  });

  it('creates geofences on the Ola geofence endpoint', async () => {
    g.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse({ geofenceId: 'f1', status: 'created' }));
    const created = await client.geofencing.create({
      name: 'Depot',
      projectId: 'p1',
      geometry: {
        type: 'circle',
        center: { lat: 12.9, lng: 77.6 },
        radius: 500,
      },
    });
    expect(requestedUrl()).toContain(
      'https://api.olamaps.io/places/v1/geofence'
    );
    expect(lastRequestInit().method).toBe('POST');
    expect(lastRequestInit().body).toBe(
      JSON.stringify({
        name: 'Depot',
        status: 'active',
        projectId: 'p1',
        type: 'circle',
        radius: 500,
        coordinates: [[12.9, 77.6]],
      })
    );
    expect(created).toEqual({ fenceId: 'f1', message: undefined });
  });

  it('lists geofences with required pagination params', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        page: 2,
        size: 5,
        total: 7,
        geofences: [
          {
            geofenceId: 'f1',
            name: 'Depot',
            type: 'circle',
            coordinates: [[12.9, 77.6]],
            radius: 500,
            status: 'active',
            projectId: 'p1',
          },
        ],
      })
    );
    const list = await client.geofencing.list('p1', { page: 2, pageSize: 5 });
    expect(requestedUrl()).toContain(
      'https://api.olamaps.io/places/v1/geofences'
    );
    expect(requestedUrl()).toContain('projectId=p1');
    expect(requestedUrl()).toContain('page=2');
    expect(requestedUrl()).toContain('size=5');
    expect(list.total).toBe(7);
    expect(list.fences[0]).toEqual({
      fenceId: 'f1',
      name: 'Depot',
      projectId: 'p1',
      geometry: {
        type: 'circle',
        center: { lat: 12.9, lng: 77.6 },
        radius: 500,
      },
      status: 'active',
    });
  });

  it('checks geofence status with the coordinates param', async () => {
    g.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse({ geofenceId: 'f1', isInside: true }));
    const status = await client.geofencing.checkStatus('f1', {
      lat: 12.9,
      lng: 77.6,
    });
    expect(requestedUrl()).toContain('/places/v1/geofence/status');
    expect(requestedUrl()).toContain('geofenceId=f1');
    expect(requestedUrl()).toContain('coordinates=12.9%2C77.6');
    expect(status).toEqual({
      fenceId: 'f1',
      isInside: true,
      message: undefined,
    });
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
    await client.elevation.getElevation('12.9,77.6');
    expect(requestedUrl()).toContain(
      'https://sdk.mappls.com/map/utils/elevation'
    );
    expect(requestedUrl()).toContain('locations=12.9%2C77.6');
  });

  it('uses Mappls autosuggest endpoint', async () => {
    g.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse({ suggestedLocations: [] }));
    await client.places.autocomplete('delhi');
    expect(requestedUrl()).toContain(
      'https://search.mappls.com/search/places/autosuggest/json'
    );
    expect(requestedUrl()).toContain('query=delhi');
    expect(requestedUrl()).toContain('access_token=test-token');
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

  it('rejects address validation with an unsupported error', async () => {
    await expect(client.places.addressValidation('Pune')).rejects.toThrow(
      expect.objectContaining({ code: 'UNSUPPORTED_ERROR' })
    );
  });

  it('rejects auto mode on Mappls routing', async () => {
    await expect(
      client.routing.getDirections('12.9,77.6', '13.0,77.7', { mode: 'auto' })
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

  it('normalizes legacy OSRM-style directions responses', async () => {
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

  it('normalizes current Google-style directions responses', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        status: 'OK',
        routes: [
          {
            summary: 'NH44',
            overview_polyline: 'u`nAoc~uMeg',
            legs: [
              {
                distance: 3836,
                duration: 698,
                steps: [
                  {
                    distance: 476,
                    duration: 99,
                    instructions: 'Head west on NH48',
                    maneuver: 'turn-right',
                    start_location: { lat: 12.90934, lng: 77.62169 },
                  },
                ],
              },
            ],
          },
        ],
      })
    );

    const result = await client.routing.getDirections('12.9,77.6', '13.0,77.7');
    expect(result.code).toBe('OK');
    expect(result.routes[0]?.geometry).toBe('u`nAoc~uMeg');
    expect(result.routes[0]?.distance).toBe(3836);
    expect(result.routes[0]?.duration).toBe(698);
    const step = result.routes[0]?.legs?.[0]?.steps?.[0];
    expect(step?.instructions).toBe('Head west on NH48');
    expect(step?.location).toEqual([77.62169, 12.90934]);
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

  it('normalizes optimizer waypoint_order from the first route', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        status: 'OK',
        routes: [
          {
            waypoint_order: [0, 3, 2, 1],
            legs: [{ distance: 100, duration: 20 }],
          },
        ],
      })
    );

    const result = await client.routing.routeOptimizer([
      '12.9,77.6',
      '13.0,77.7',
      '13.1,77.8',
      '13.2,77.9',
    ]);
    expect(result.order).toEqual([0, 3, 2, 1]);
    expect(result.distance).toBe(100);
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

    const elevation = await client.elevation.getElevation('12.9,77.6');
    expect(elevation.elevation).toBe(920);
    expect(elevation.location).toEqual({ lat: 12.9, lng: 77.6 });
  });

  it('normalizes snapped points', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        status: 'SUCCESS',
        snapped_points: [
          {
            location: { lat: 12.9, lng: 77.6 },
            original_index: 0,
            snapped_type: 'Match',
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
      snappedType: 'Match',
      placeId: undefined,
    });
  });

  it('normalizes speed limit entries keyed by original index', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        status: 'SUCCESS',
        snappedPoints: [
          {
            location: { latitude: 12.9, longitude: 77.6 },
            originalIndex: 0,
          },
        ],
        speedLimits: [{ originalIndex: 0, speedLimit: 60 }],
      })
    );

    const result = await client.roads.speedLimits([
      { latitude: 12.9, longitude: 77.6 },
    ]);
    expect(result.speedLimits).toEqual([{ originalIndex: 0, speedLimit: 60 }]);
    expect(result.snappedPoints[0]?.location).toEqual({
      latitude: 12.9,
      longitude: 77.6,
    });
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
