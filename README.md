# react-native-india-maps

A React Native SDK for India Maps powered by **MapLibre** for rendering and supporting both **Ola Maps** and **Mappls** API backends.

## Features

- 🗺️ Map rendering via `@maplibre/maplibre-react-native` (no proprietary native SDKs)
- 🔄 Dual-provider: Ola Maps (default) and Mappls backends
- 📍 Full Places API (autocomplete, geocode, reverse geocode, nearby, text search)
- 🛣️ Routing API (directions, distance matrix, route optimizer)
- 🛤️ Roads API (snap to road, nearest roads, speed limits)
- 🏔️ Elevation API
- 📐 Geofencing API (Ola Maps only)
- 🎨 Multiple map styles (light, dark, satellite, and more)
- ⚡ Expo config plugin for location permissions

## Install

```sh
bun add react-native-india-maps @maplibre/maplibre-react-native@^11.0.0
```

Requires React `>=19.2.0` and React Native `>=0.83.0` (Expo SDK 55+ development builds are supported). See [docs/installation.md](./docs/installation.md) for details.

## Expo setup

Use an Expo development build, not Expo Go.

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-india-maps",
        {
          "iosWhenInUsePermission": "Allow $(PRODUCT_NAME) to access your location while using the app.",
          "backgroundLocation": false
        }
      ]
    ]
  }
}
```

The plugin adds location permissions for both Android and iOS. No native SDK configuration files are needed — MapLibre handles all map rendering.

MapLibre React Native v11 requires the React Native New Architecture. Expo Go is not supported.

## Provider and hooks

```tsx
import {
  IndiaMapsProvider,
  IndiaMapsClient,
  MapView,
  Marker,
  useAutocomplete,
} from 'react-native-india-maps';

// Ola Maps (default provider)
const client = new IndiaMapsClient({ apiKey: 'YOUR_OLA_MAPS_API_KEY' });

// Or Mappls provider
// const client = new IndiaMapsClient({ accessToken: 'YOUR_MAPPLS_TOKEN', provider: 'mappls' });

function SearchBox() {
  const { results, debouncedSearch } = useAutocomplete({ debounceMs: 300 });
  return null;
}

export function App() {
  return (
    <IndiaMapsProvider client={client}>
      <MapView
        style={{ flex: 1 }}
        styleName="default-light-standard"
        initialRegion={{ latitude: 28.6139, longitude: 77.209, zoomLevel: 12 }}
      >
        <Marker
          id="delhi"
          coordinate={{ latitude: 28.6139, longitude: 77.209 }}
        />
      </MapView>
      <SearchBox />
    </IndiaMapsProvider>
  );
}
```

## Dual-provider support

The SDK supports two backends:

| Feature | Ola Maps | Mappls |
| --- | --- | --- |
| Auth param | `api_key` | `access_token` |
| Base URL | `https://api.olamaps.io` | `https://search.mappls.com`, `https://route.mappls.com`, `https://sdk.mappls.com` |
| Map tiles | ✅ Vector tiles | ❌ Not public |
| Geofencing | ✅ | ❌ Not public |

```ts
// Ola Maps (default)
const olaClient = new IndiaMapsClient({ apiKey: 'YOUR_KEY' });

// Mappls
const mapplsClient = new IndiaMapsClient({
  accessToken: 'YOUR_TOKEN',
  provider: 'mappls',
});
```

## API coverage

### Places

- Autocomplete / Autosuggest
- Geocode
- Reverse Geocode
- Place Details
- Nearby Search
- Text Search

### Routing

- Directions (driving, walking, biking)
- Distance Matrix
- Route Optimizer

### Roads

- Snap to Road
- Nearest Roads
- Speed Limits

### Elevation

- Single point elevation
- Multi-point elevation

### Geofencing (Ola Maps only)

- Create / Read / Update / Delete geofences
- Check point status (inside/outside)

### Tiles

- Vector tile style URLs for MapLibre
- Static map image URLs
- Request transform helper for API key injection

## Base URL overrides

Every endpoint resolves against a base URL that you can override, which is useful for
corporate proxies or self-hosted gateways. `baseUrl` redirects everything; the
domain-specific options take precedence over it when set.

```ts
// Redirect all traffic
const client = new IndiaMapsClient({ apiKey: 'k', baseUrl: 'https://proxy.internal' });

// Or redirect a single domain
const client = new IndiaMapsClient({
  apiKey: 'k',
  searchBaseUrl: 'https://proxy.internal', // places + geocoding
  routeBaseUrl: 'https://proxy.internal', // routing, elevation, roads
  sdkBaseUrl: 'https://proxy.internal', // geofencing
  tileBaseUrl: 'https://proxy.internal', // styles + static maps
});
```

Without overrides, each provider uses its own public hosts. Mappls spreads capabilities
across `search.mappls.com` (places, geocoding, nearby, text search), `place.mappls.com`
(place details), `route.mappls.com` (directions, distance matrix, route optimization,
roads), `sdk.mappls.com` (elevation) and `tile.mappls.com` (static maps), while Ola Maps
serves everything from `api.olamaps.io`.

## Map styles

Use the `MAP_STYLES` presets or any provider-specific style name:

```ts
import { MAP_STYLES } from 'react-native-india-maps';

// MAP_STYLES.lightStandard === 'default-light-standard'
<MapView styleName={MAP_STYLES.darkStandard} style={{ flex: 1 }} />;
```

Available Ola Maps styles: `default-light-standard`, `default-dark-standard`, `default-light-lite`, `default-dark-lite`, `default-light-full`, `default-dark-full`, `eclipse-light-standard`, `eclipse-dark-standard`, `bolt-light`, `bolt-dark`, `vintage-light`, `vintage-dark`, and more.

## Migrating from 0.2.x

Version 0.3.0 redesigns the public API. The most common changes:

- **Methods return domain types directly.** The `ApiResponse` / `PaginatedResponse` envelopes were removed. For example, `autocomplete` now resolves to `AutocompleteSuggestion[]`, and `geocode` to `GeocodeResult[]`.
- **Positional, typed signatures.** `geocode(address, options?)`, `reverseGeocode(location, options?)` and `placeDetails(placeId, options?)` take their primary input as a positional argument. Coordinate inputs accept `LatLng`, `{ latitude, longitude }`, `[lng, lat]` or `'lat,lng'` strings (`LatLngInput`).
- **camelCase option names.** `rankby` → `rankBy`, `strictbounds` → `strictBounds`, `roundtrip` → `roundTrip`, `traffic_metadata` → `trafficMetadata`, `routepreference` → `routePreference`.
- **Closed unions.** `TravelMode` is `'driving' | 'walking' | 'biking' | 'trucking'`, and `overview` is `'full' | 'simplified' | false`.
- **Single error type.** All failures throw `IndiaMapsError` with a `code` of `'CONFIGURATION_ERROR' | 'NETWORK_ERROR' | 'API_ERROR' | 'PARSE_ERROR' | 'UNSUPPORTED_ERROR'`.
- **Style presets.** `MAP_STYLES` exports well-known Ola Maps style names; `MapView` uses `styleName` (default `default-light-standard`) instead of `accessToken`-keyed style resolution.

### Migrating from 0.4.x

Version 0.5.0 removes previously-deprecated aliases. Update your imports:

- Replace `OlaMapsClient` with `IndiaMapsClient`
- Replace `OlaMapsProvider` with `IndiaMapsProvider`
- Replace `useOlaMaps` with `useIndiaMaps`
- Replace `OlaMapsConfig` with `IndiaMapsConfig`
- Replace `OlaMapsError` with `IndiaMapsError`
- Replace `OlaMapsErrorCode` with `IndiaMapsErrorCode`
- Replace `OlaMapViewProps` with `IndiaMapViewProps`
- Replace `SnapToRoadPoint` with `RoadPoint`
- Replace `autoSuggest` with `autocomplete` (no longer an alias)
- Replace `placeDetailsAdvanced` with `placeDetails` (no longer an alias)
- Replace `nearbySearchAdvanced` with `nearbySearch` (no longer an alias)
- Replace `getDirectionsBasic` with `getDirections` (no longer an alias)
- Replace `getDistanceMatrixBasic` with `getDistanceMatrix` (no longer an alias)
- `RoutingApi.fleetPlanner` has been removed — fleet planning has no public REST API

### Migrating from 0.5.x

Version 0.6.0 corrects the Mappls endpoints to the hosts in the current official
documentation (the previous release used legacy `atlas.mappls.com`/`apis.mappls.com`
paths that no longer resolve). No Ola Maps behaviour changes.

- Mappls requests now target the current public hosts: `search.mappls.com` for
  autosuggest, geocoding, reverse geocoding, nearby and text search,
  `place.mappls.com` for place details, `route.mappls.com` for directions,
  distance matrix, route optimization and snap to road, `sdk.mappls.com` for
  elevation and `tile.mappls.com` for static maps.
- `DirectionsOptions.resource` for Mappls is now `'route_adv' | 'route_eta' | 'route_traffic'`
  (default `'route_adv'`); the previous `'route'` value was not a valid resource.
- `GeofencingApi.list(projectId, options?)` takes `{ page, limit }` instead of
  two positional numbers.
- `RoadsApi.nearestRoads(points, options?)` takes `{ radius }` instead of
  `(points, mode, radius)`; `mode` was never sent to a provider.
- `RoadsApi.speedLimits(points)` dropped its unused second parameter.
- `AutocompleteOptions.zoom`, `TextSearchOptions.zoom`/`hyperLocal`/`pod`/`tokenizeAddress`
  and `NearbySearchOptions.richData` were removed because the endpoints accept no
  such parameters.

## Notes

- `apiKey` is used for Ola Maps API authentication
- `accessToken` is used for Mappls API authentication

## License

LGPL-3.0-or-later. See [LICENSE.txt](./LICENSE.txt).
