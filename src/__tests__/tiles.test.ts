import { TilesApi } from '../api/tiles';

describe('TilesApi', () => {
  const tiles = new TilesApi({ accessToken: 'test-token' });

  it('returns MapLibre style URL for Ola Maps', () => {
    const url = tiles.getStyleURL('default-light-standard');
    expect(url).toContain(
      '/tiles/vector/v1/styles/default-light-standard/style.json'
    );
    expect(url).toContain('api_key=test-token');
  });

  it('returns style name for Mappls provider', () => {
    const mapplsTiles = new TilesApi({
      accessToken: 'test-token',
      provider: 'mappls',
    });
    expect(mapplsTiles.getStyleURL('standard')).toBe('standard');
  });

  it('builds Ola static map URLs', () => {
    const url = tiles.getStaticMapURL({
      center: [77.6, 12.9],
      zoom: 12,
      width: 600,
      height: 400,
      markers: ['12.9,77.6'],
    });

    expect(url).toContain(
      '/tiles/v1/styles/default-light-standard/static/77.6,12.9,12/600x400.png'
    );
    expect(url).toContain('marker=77.6%2C12.9');
    expect(url).toContain('api_key=test-token');
  });

  it('accepts coordinates as markers', () => {
    const url = tiles.getStaticMapURL({
      center: [77.6, 12.9],
      zoom: 12,
      width: 600,
      height: 400,
      markers: [{ latitude: 12.9, longitude: 77.6 }],
    });

    expect(url).toContain('marker=77.6%2C12.9');
  });

  it('builds Ola path overlays with style options', () => {
    const url = tiles.getStaticMapURL({
      center: [77.6, 12.9],
      zoom: 12,
      width: 600,
      height: 400,
      path: {
        coordinates: [
          [77.61, 12.93],
          [77.62, 12.94],
        ],
        widthPx: 6,
        strokeColor: '#00ff44',
      },
    });

    expect(url).toContain(
      'path=77.61%2C12.93%7C77.62%2C12.94%7Cwidth%3A6%7Cstroke%3A%2300ff44'
    );
  });

  it('honors the Ola image format option', () => {
    const url = tiles.getStaticMapURL({
      center: [77.6, 12.9],
      zoom: 12,
      width: 600,
      height: 400,
      style: 'default-dark-standard',
      format: 'jpg',
    });

    expect(url).toContain(
      '/tiles/v1/styles/default-dark-standard/static/77.6,12.9,12/600x400.jpg'
    );
  });

  it('builds Mappls static map URLs', () => {
    const mapplsTiles = new TilesApi({
      accessToken: 'test-token',
      provider: 'mappls',
    });
    const url = mapplsTiles.getStaticMapURL({
      center: [77.6, 12.9],
      zoom: 12,
      width: 600,
      height: 400,
      markers: ['12.9,77.6'],
    });

    expect(url).toContain('/map/raster_tile/still_image');
    expect(url).toContain('center=12.9%2C77.6');
    expect(url).toContain('access_token=test-token');
  });

  it('throws a configuration error without a token', () => {
    const anonymousTiles = new TilesApi();
    expect(() =>
      anonymousTiles.getStaticMapURL({
        center: [77.6, 12.9],
        zoom: 12,
        width: 600,
        height: 400,
      })
    ).toThrow(expect.objectContaining({ code: 'CONFIGURATION_ERROR' }));
  });

  it('returns v11-compatible map options', () => {
    expect(
      tiles.getMapOptions({
        style: 'default-light-standard',
        center: [77.6, 12.9],
        zoom: 14,
        bearing: 15,
        pitch: 30,
      })
    ).toEqual({
      mapStyle: expect.stringContaining(
        '/tiles/vector/v1/styles/default-light-standard/style.json'
      ),
      center: [77.6, 12.9],
      zoom: 14,
      bearing: 15,
      pitch: 30,
    });
  });
});
