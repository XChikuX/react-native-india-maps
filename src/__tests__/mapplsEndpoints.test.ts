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

const mapplsClient = () =>
  new IndiaMapsClient({ accessToken: 'test-token', provider: 'mappls' });

describe('Mappls request construction', () => {
  beforeEach(() => {
    g.fetch = jest.fn().mockResolvedValue(jsonResponse({}));
  });

  it('uses the autosuggest endpoint with a query parameter', async () => {
    const client = mapplsClient();
    await client.places.autocomplete('delhi');
    expect(requestedUrl()).toContain(
      'https://search.mappls.com/search/places/autosuggest/json'
    );
    expect(requestedUrl()).toContain('query=delhi');
    expect(requestedUrl()).toContain('access_token=test-token');
  });

  it('uses the geocode endpoint with an address parameter', async () => {
    const client = mapplsClient();
    await client.places.geocode('new delhi');
    expect(requestedUrl()).toContain(
      'https://search.mappls.com/search/address/geocode'
    );
    expect(requestedUrl()).toContain('address=new+delhi');
  });

  it('uses the reverse-geocode endpoint with lat/lng parameters', async () => {
    const client = mapplsClient();
    await client.places.reverseGeocode({ latitude: 12.9, longitude: 77.6 });
    expect(requestedUrl()).toContain(
      'https://search.mappls.com/search/address/rev-geocode'
    );
    expect(requestedUrl()).toContain('lat=12.9');
    expect(requestedUrl()).toContain('lng=77.6');
  });

  it('uses the place-details endpoint on the place host', async () => {
    const client = mapplsClient();
    await client.places.placeDetails('MMI000');
    expect(requestedUrl()).toContain(
      'https://place.mappls.com/apis/O2O/entity/MMI000'
    );
    expect(requestedUrl()).toContain('access_token=test-token');
  });

  it('uses the nearby endpoint with keywords and refLocation', async () => {
    const client = mapplsClient();
    await client.places.nearbySearch(
      { latitude: 28.45, longitude: 77.43 },
      { keyword: 'coffee' }
    );
    expect(requestedUrl()).toContain(
      'https://search.mappls.com/api/places/nearby/json'
    );
    expect(requestedUrl()).toContain('keywords=coffee');
    expect(requestedUrl()).toContain('refLocation=28.45%2C77.43');
  });

  it('uses the text-search endpoint with a query parameter', async () => {
    const client = mapplsClient();
    await client.places.textSearch('coffee', {
      location: { latitude: 28.45, longitude: 77.43 },
    });
    expect(requestedUrl()).toContain(
      'https://search.mappls.com/api/places/textsearch/json'
    );
    expect(requestedUrl()).toContain('query=coffee');
    expect(requestedUrl()).toContain('location=28.45%2C77.43');
  });

  it('uses the route_adv resource for directions', async () => {
    const client = mapplsClient();
    await client.routing.getDirections('12.9,77.6', '13.05,77.7');
    expect(requestedUrl()).toContain(
      'https://route.mappls.com/route/direction/route_adv/driving/77.6,12.9;77.7,13.05'
    );
    expect(requestedUrl()).toContain('access_token=test-token');
  });

  it('uses the distance-matrix endpoint with sources and destinations', async () => {
    const client = mapplsClient();
    await client.routing.getDistanceMatrix(['12.9,77.6'], ['13.0,77.7']);
    expect(requestedUrl()).toContain(
      'https://route.mappls.com/route/dm/distance_matrix/driving/77.6,12.9;77.7,13'
    );
    expect(requestedUrl()).toContain('sources=0');
    expect(requestedUrl()).toContain('destinations=1');
  });

  it('uses the optimization endpoint for the route optimizer', async () => {
    const client = mapplsClient();
    await client.routing.routeOptimizer(['12.9,77.6', '13.05,77.7']);
    expect(requestedUrl()).toContain(
      'https://route.mappls.com/route/optimization/trip_optimization_eta/driving/77.6,12.9;77.7,13.05'
    );
  });

  it('uses the movement snap-to-road endpoint with a pts parameter', async () => {
    const client = mapplsClient();
    await client.roads.snapToRoad([{ latitude: 12.9, longitude: 77.6 }]);
    expect(requestedUrl()).toContain(
      'https://route.mappls.com/route/movement/snapToRoad'
    );
    expect(requestedUrl()).toContain('pts=77.6%2C12.9');
  });

  it('uses the sdk elevation endpoint', async () => {
    const client = mapplsClient();
    await client.elevation.getMultiElevation([{ lat: 12.9, lng: 77.6 }]);
    expect(requestedUrl()).toContain(
      'https://sdk.mappls.com/map/utils/elevation'
    );
    expect(requestedUrl()).toContain('locations=12.9%2C77.6');
  });

  it('builds static map URLs on the tile host', () => {
    const client = mapplsClient();
    const url = client.tiles.getStaticMapURL({
      center: [77.6, 12.9],
      zoom: 12,
      width: 200,
      height: 200,
    });
    expect(url).toContain(
      'https://tile.mappls.com/map/raster_tile/still_image'
    );
    expect(url).toContain('center=12.9%2C77.6');
    expect(url).toContain('access_token=test-token');
  });
});

describe('Mappls response normalization', () => {
  beforeEach(() => {
    g.fetch = jest.fn().mockResolvedValue(jsonResponse({}));
  });

  it('normalizes autosuggest locations', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        suggestedLocations: [
          {
            eLoc: 'MMI000',
            placeName: 'MapmyIndia Head Office',
            placeAddress: 'Okhla Industrial Estate Phase 3, New Delhi',
            distance: '9101',
            type: 'POI',
          },
        ],
      })
    );

    const suggestions = await mapplsClient().places.autocomplete('mapmyindia');
    expect(suggestions[0]).toEqual({
      placeId: 'MMI000',
      name: 'MapmyIndia Head Office',
      address: 'Okhla Industrial Estate Phase 3, New Delhi',
      distanceMeters: 9101,
      location: undefined,
      types: ['POI'],
    });
  });

  it('normalizes a single-object geocode result', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        copResults: {
          eLoc: '2LH9OC',
          formattedAddress: '237, MMI Building, Okhla, New Delhi',
        },
      })
    );

    const results = await mapplsClient().places.geocode('237 okhla');
    expect(results).toHaveLength(1);
    expect(results[0]?.placeId).toBe('2LH9OC');
    expect(results[0]?.formattedAddress).toBe(
      '237, MMI Building, Okhla, New Delhi'
    );
  });

  it('normalizes reverse-geocode results', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        responseCode: 200,
        version: '211.19',
        results: [
          {
            eLoc: '2LH9OC',
            formatted_address: 'Okhla, New Delhi, 110010',
            lat: '28.426335',
            lng: '77.092001',
          },
        ],
      })
    );

    const results = await mapplsClient().places.reverseGeocode('12.9,77.6');
    expect(results[0]).toEqual({
      placeId: '2LH9OC',
      formattedAddress: 'Okhla, New Delhi, 110010',
      location: { lat: 28.426335, lng: 77.092001 },
    });
  });

  it('normalizes place details', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        eloc: '3F45CB',
        name: 'The Lalit New Delhi',
        address: '15, Barakhamba Avenue, Connaught Place',
        latitude: 28.6311600000001,
        longitude: 77.2274580000001,
      })
    );

    const details = await mapplsClient().places.placeDetails('3F45CB');
    expect(details).toEqual({
      placeId: '3F45CB',
      name: 'The Lalit New Delhi',
      formattedAddress: '15, Barakhamba Avenue, Connaught Place',
      location: { lat: 28.6311600000001, lng: 77.2274580000001 },
    });
  });

  it('normalizes nearby results that use a lowercase eloc', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        suggestedLocations: [
          {
            eloc: 'CHZZ3S',
            placeName: 'Lord of The Drinks',
            placeAddress: 'Connaught Place, New Delhi',
            distance: '64',
          },
        ],
      })
    );

    const results = await mapplsClient().places.nearbySearch('28.45,77.43');
    expect(results[0]?.placeId).toBe('CHZZ3S');
    expect(results[0]?.distanceMeters).toBe(64);
  });

  it('normalizes text-search results from suggestedLocation', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        suggestedLocation: [
          { eLoc: 'ABC123', placeName: 'Adidas', placeAddress: 'CP' },
        ],
      })
    );

    const results = await mapplsClient().places.textSearch('adidas');
    expect(results[0]?.placeId).toBe('ABC123');
    expect(results[0]?.name).toBe('Adidas');
  });

  it('normalizes the results-enveloped distance matrix grids', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        responseCode: 200,
        version: '191.17',
        results: {
          code: 'Ok',
          distances: [[0, 6817.7, 20475.7]],
          durations: [[0, 1844.4, 5307.5]],
        },
      })
    );

    const result = await mapplsClient().routing.getDistanceMatrix(
      ['12.9,77.6'],
      ['13.0,77.7', '13.1,77.8']
    );
    expect(result.distances).toEqual([[0, 6817.7, 20475.7]]);
    expect(result.durations).toEqual([[0, 1844.4, 5307.5]]);
  });

  it('normalizes snap-to-road points from lng/lat tuples and skips nulls', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        responseCode: 200,
        version: '220.19.522',
        results: {
          snappedPoints: [
            {
              location: [78.40573, 17.373168],
              distance: 0.22,
              waypoint_index: 0,
            },
            null,
            {
              location: [78.420424, 17.377454],
              distance: 4.01,
              waypoint_index: 2,
            },
          ],
          matchings: [{ geometry: 'abc' }],
        },
      })
    );

    const result = await mapplsClient().roads.snapToRoad([
      { latitude: 17.37317, longitude: 78.40573 },
      { latitude: 17.37314, longitude: 78.40958 },
      { latitude: 17.377443, longitude: 78.42046 },
    ]);
    expect(result.snappedPoints).toEqual([
      {
        location: { latitude: 17.373168, longitude: 78.40573 },
        originalIndex: 0,
        placeId: undefined,
      },
      {
        location: { latitude: 17.377454, longitude: 78.420424 },
        originalIndex: 2,
        placeId: undefined,
      },
    ]);
  });

  it('normalizes elevation results from the sdk host', async () => {
    g.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        responseCode: 200,
        version: '211.18',
        results: [{ longitude: 76.998825, latitude: 9.53835, elevation: 523 }],
      })
    );

    const result = await mapplsClient().elevation.getMultiElevation([
      { lat: 9.53835, lng: 76.998825 },
    ]);
    expect(result.results[0]).toEqual({
      elevation: 523,
      location: { lat: 9.53835, lng: 76.998825 },
      resolution: undefined,
    });
  });
});
