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
bun add react-native-india-maps @maplibre/maplibre-react-native@^11.5.0
```

Requires React `>=19.2.0` and React Native `>=0.83.0` (Expo SDK 55+ development builds are supported). See [docs/installation.md](./docs/installation.md) for details.

## Expo setup

Use an Expo development build, not Expo Go.

```json
{
  "expo": {
    "plugins": [
      "@maplibre/maplibre-react-native",
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

The `@maplibre/maplibre-react-native` plugin configures native MapLibre integration (including iOS Podfile setup); keep it in the plugin list alongside this package's location-permission plugin. No Mappls native SDK configuration files are needed — MapLibre handles map rendering. This package's plugin does not ingest API credentials; supply the Ola Maps API key or Mappls access token to `IndiaMapsClient` at runtime. See [Expo runtime credentials](./docs/installation.md#runtime-api-credentials) for local and EAS setup, including the client-bundling security caveat.

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
- Address Validation (Ola Maps)

### Routing

- Directions (driving, walking, biking, auto; trucking on Mappls)
- Distance Matrix
- Route Optimizer

### Roads

- Snap to Road
- Nearest Roads
- Speed Limits (km/h readings keyed by input index)

### Elevation

- Single point elevation
- Multi-point elevation

### Geofencing (Ola Maps only)

- Create / Read / Update / Delete geofences
- Check point status (inside/outside)

### Tiles

- Vector tile style URLs for MapLibre
- Static map image URLs (markers, path overlays, png/jpg)
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
- **Closed unions.** `TravelMode` is `'driving' | 'walking' | 'biking' | 'auto' | 'trucking'`, and `overview` is `'full' | 'simplified' | false`.
- **Single error type.** All failures throw `IndiaMapsError` with a `code` of `'CONFIGURATION_ERROR' | 'NETWORK_ERROR' | 'API_ERROR' | 'PARSE_ERROR' | 'UNSUPPORTED_ERROR' | 'INVALID_INPUT_ERROR'`.
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
paths that no longer resolve). See “Migrating from 0.6.x” for the Ola Maps
corrections in 0.7.0.

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

### Migrating from 0.6.x

Version 0.7.0 corrects the Ola Maps integration against the current official
OpenAPI specification (`maps.olakrutrim.com/openapi/ola-maps-apis-oas.yaml`);
0.6.x used stale endpoint paths and parameter names that no longer resolve.
Mappls behaviour is unchanged.

- **Routing requests rebuilt.** Directions and route optimization are now
  `POST` requests to `/routing/v1/directions` and `/routing/v1/routeOptimizer`
  with query parameters (`origin`, `destination`, `waypoints`, `locations`,
  `round_trip`, …); the distance matrix is `GET /routing/v1/distanceMatrix`.
  The legacy `/routing/v1/directions/{mode}/{coords}` path style is gone.
  Response normalizers now accept both the current Google-style payloads
  (`status`, `overview_polyline`, `legs`-totalled routes, `waypoint_order`) and
  the legacy OSRM-style payloads.
- **Elevation moved.** `GET/POST /places/v1/elevation` replaces
  `/elevation/v1/getElevation`. `getElevation` now takes one coordinate
  argument: `getElevation('12.9,77.6')` instead of `getElevation(12.9, 77.6)`.
  Multi lookups cap at 25 coordinates.
- **Geofencing moved.** Fences now live at `/places/v1/geofence` (CRUD) and
  `/places/v1/geofences` (list with `projectId`, `page`, `size`). `create` and
  `update` return `GeofenceWriteResult` (`fenceId`, `message`); `update` takes
  the full `GeofenceData` (provider updates are whole-object replacements);
  `GeofenceListOptions` renamed `limit` to `pageSize`; `checkStatus` results
  expose `isInside`; geofences carry `status` (`active`/`inactive`) and no
  longer expose `metadata`/`createdAt`/`updatedAt`.
- **Static map URLs rebuilt.** Ola static images use the path-embedded form
  `/tiles/v1/styles/{style}/static/{lon},{lat},{zoom}/{width}x{height}.{format}`
  with `marker`/`path` query overlays. `StaticMapOptions` gains `format`
  (`'png' | 'jpg'`) and `path` (polyline overlay).
- **Roads params corrected.** `snapToRoad` sends `enhancePath` (was never
  honored as `interpolate`); `nearestRoads` sends the required snap-validation
  `mode` (default `driving`); `speedLimits` gained a `snapStrategy` option and
  results now normalize to `{ originalIndex, speedLimit }` (km/h), matching
  the documented response instead of the old `placeId`/`units` shape.
  `SnappedPoint` gained `snappedType` (`Nearest`/`Match`/`NoSegment`).
- **Travel modes.** `TravelMode` gained `'auto'` (Ola). Ola rejects
  `'trucking'`; Mappls supports `'trucking'` and rejects `'auto'`. Mappls also
  validates travel mode/resource combinations per endpoint; see
  [Mappls provider notes](./docs/mappls.md).
- **Mappls optimizer defaults and validation.** The default resource is now
  `trip_optimization` (no traffic); select an ETA/traffic resource explicitly
  when appropriate. `roundTrip: false` requires `source: 'first'` and
  `destination: 'last'`, otherwise the client throws `INVALID_INPUT_ERROR`.
- **Closed invalid options.** `RoutePreference` dropped `'eco'` (not accepted);
  `DistanceMatrixOptions.language` and `TextSearchOptions.language` were
  removed (endpoints accept no language parameter); `NearbySearchOptions`
  `rankBy` values are now `'popular' | 'distance'` and gained `limit` (5-50)
  and `withCentroid`; the Ola nearby-search request no longer sends `keyword`
  (Mappls-only).
- **Address validation.** `PlacesApi.addressValidation` uses the dedicated
  `/places/v1/addressvalidation` endpoint on Ola and returns
  `AddressValidationResult` (`isAddressValid`, `validatedAddress`); Mappls
  throws `UNSUPPORTED_ERROR` (use `geocode()` there).
- **New error code.** `IndiaMapsError` can now carry `'INVALID_INPUT_ERROR'`
  for arguments outside provider limits (e.g. >25 waypoints).

## Notes

- `apiKey` is used for Ola Maps API authentication
- `accessToken` is used for Mappls API authentication

## License

LGPL-3.0-or-later. See [LICENSE.txt](./LICENSE.txt).
