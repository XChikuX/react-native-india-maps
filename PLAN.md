# Migration Plan: react-native-ola-maps

## Vision

Rebuild `react-native-ola-maps` as a modern React Native SDK for Ola Maps, modeled after `react-native-radar` in structure but focused exclusively on Ola Maps features. Use `@maplibre/maplibre-react-native` (v11) as the map rendering engine, with full API fidelity to [`ola-map-sdk`](https://www.npmjs.com/package/ola-map-sdk).

---

## Architecture Overview

```
react-native-ola-maps/
├── src/
│   ├── index.ts                    # Main entry - exports OlaMaps client + components
│   ├── OlaMapsClient.ts           # Core SDK client (API fidelity with ola-map-sdk)
│   ├── api/
│   │   ├── places.ts              # Places API (autocomplete, geocode, reverse, nearby, text search)
│   │   ├── routing.ts             # Routing API (directions, distance matrix, route optimizer)
│   │   ├── roads.ts               # Roads API (snap to road, nearest roads, speed limits)
│   │   ├── geofencing.ts          # Geofencing API (CRUD, status check)
│   │   ├── elevation.ts           # Elevation API
│   │   └── tiles.ts               # Tiles API (styles, static maps, 3D)
│   ├── components/
│   │   ├── MapView.tsx            # MapLibre-powered map (wraps @maplibre/maplibre-react-native)
│   │   ├── Marker.tsx             # Map markers
│   │   ├── Polyline.tsx           # Route polylines
│   │   ├── Polygon.tsx            # Geofence polygons
│   │   ├── UserLocation.tsx       # Current location indicator
│   │   └── Callout.tsx            # Info callouts
│   ├── hooks/
│   │   ├── useOlaMaps.ts          # Context hook for OlaMaps client
│   │   ├── useAutocomplete.ts     # Places autocomplete hook
│   │   ├── useDirections.ts       # Routing directions hook
│   │   ├── useReverseGeocode.ts   # Reverse geocoding hook
│   │   └── useGeofencing.ts       # Geofencing hook
│   ├── providers/
│   │   └── OlaMapsProvider.tsx    # React context provider with API key
│   └── types/
│       ├── index.ts               # All type exports
│       ├── places.ts              # Places API types
│       ├── routing.ts             # Routing API types
│       ├── roads.ts               # Roads API types
│       ├── geofencing.ts          # Geofencing API types
│       ├── elevation.ts           # Elevation API types
│       └── tiles.ts               # Tiles API types
├── example/                        # Example app (Expo-based)
├── CLAUDE.md
├── PLAN.md
├── LICENSE                         # GNU LGPLv3
├── package.json                    # bun-based
├── tsconfig.json
└── README.md
```

---

## API Surface (ola-map-sdk fidelity)

### 1. Places API

- `autocomplete(input, options?)` → search suggestions
- `geocode(address, language?)` → lat/lng from address
- `reverseGeocode(lat, lng, language?)` → address from lat/lng
- `placeDetails(placeId, language?)` → place info
- `nearbySearch(location, options?)` → nearby places
- `textSearch(input, options?)` → free-text search
- `addressValidation(address)` → validate an address
- `photo(photoReference)` → place photo

### 2. Routing API

- `getDirections(origin, destination, options?)` → route with traffic
- `getDistanceMatrix(origins, destinations, options?)` → distance/duration matrix
- `routeOptimizer(locations, options?)` → optimized route

### 3. Roads API

- `snapToRoad(points, interpolate?)` → snapped GPS points
- `nearestRoads(points, mode?, radius?)` → nearest road segments
- `speedLimits(points)` → speed limit data

### 4. Geofencing API

- `create(geofenceData)` → create geofence
- `getById(fenceId)` → get geofence
- `update(fenceId, data)` → update geofence
- `deleteById(fenceId)` → delete geofence
- `list(projectId, page?, limit?)` → list geofences
- `checkStatus(fenceId, location)` → inside/outside check

### 5. Elevation API

- `getElevation(lat, lng)` → single point elevation
- `getMultiElevation(points)` → multiple points elevation

### 6. Tiles/Map Helpers

- `getStyleURL(styleName?)` → MapLibre style URL
- `getTransformRequest()` → request transformer with API key
- `getMapOptions(options?)` → full MapLibre map config

---

## Existing Code Analysis

### Current State (to be removed)

- **Android**: Uses `com.ola.mapsdk` native SDK directly (OlaMapView, OlaMap, OlaLatLng)
  - API key from AndroidManifest meta-data: `com.ola.mapsdk.API_KEY`
  - Native ViewManager pattern with `requireNativeComponent`
- **iOS**: Uses `OlaMapCore` native SDK (OlaMapService, OlaCoordinate)
  - API key from Info.plist: `OlaMapAPIKey`, `OlaMapProjectId`
  - Tile URL: `https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json`
- **JS Layer**: Minimal - just a MapView component with `initialRegion` and `onMapReady`

### API Base URL

- `https://api.olamaps.io` (all endpoints)
- Authentication: `api_key` query parameter on all requests

### Key Endpoints Discovered

| Service    | Base Path                                                  |
| ---------- | ---------------------------------------------------------- |
| Places     | `/places/v1/`                                              |
| Routing    | `/routing/v1/`                                             |
| Roads      | `/routing/v1/` (snap-to-road, nearest-roads, speed-limits) |
| Geofencing | `/geofencing/v1/`                                          |
| Elevation  | `/elevation/v1/`                                           |
| Tiles      | `/tiles/vector/v1/`                                        |

---

## Tech Stack

| Component       | Technology                                    |
| --------------- | --------------------------------------------- |
| Package Manager | **bun**                                       |
| Map Rendering   | `@maplibre/maplibre-react-native` v11         |
| Language        | TypeScript (strict)                           |
| Build           | react-native-builder-bob                      |
| HTTP Client     | Native `fetch` (no axios dependency)          |
| Module System   | Turbo Modules (React Native new architecture) |
| Testing         | Jest + @testing-library/react-native          |
| Linting         | ESLint + Prettier (eslintrc)                  |
| Example App     | Expo                                          |

---

## Migration Steps

### Phase 1: Foundation (Current)

- [x] Analyze existing codebase
- [x] Research ola-map-sdk API surface
- [x] Research @maplibre/maplibre-react-native v11
- [x] Research react-native-radar patterns
- [x] Create CLAUDE.md
- [x] Create PLAN.md
- [x] Convert license to GNU LGPLv3
- [x] Migrate to bun
- [x] Nuke old code, keep skeleton

### Phase 2: Core SDK (Next)

- [x] Implement OlaMapsClient with fetch-based HTTP
- [x] Implement Places API module
- [x] Implement Routing API module
- [x] Implement Roads API module
- [x] Implement Geofencing API module
- [x] Implement Elevation API module
- [x] Implement Tiles API module
- [x] Full TypeScript types for all APIs

### Phase 3: React Native Components

- [x] OlaMapsProvider context (IndiaMapsProvider)
- [x] MapView component (wrapping @maplibre/maplibre-react-native)
- [x] Marker, Polyline, Polygon components
- [x] UserLocation component
- [x] Callout component
- [x] Dual-provider support (Ola Maps + Mappls backends)

### Phase 4: Hooks & Integration

- [x] useIndiaMaps hook (context access)
- [x] useAutocomplete hook
- [x] useDirections hook
- [x] useReverseGeocode hook
- [x] useGeofencing hook
- [x] useAsyncRequest hook primitive

### Phase 5: Polish

- [x] Example app with all features demonstrated (`example/`, Expo development build)
- [x] Comprehensive README
- [x] API documentation
- [x] Unit tests
- [x] Integration tests (`integration/`: local HTTP server suite + gated live API suites, `bun run test:integration`)

---

## Map Styles Available

| Category      | Styles                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Default Light | `default-light-lite`, `default-light-standard`, `default-ultra-light-standard`, `default-light-full` + language variants |
| Default Dark  | `default-dark-lite`, `default-dark-standard`, `default-dark-full`, `default-dark-standard-satellite`                     |
| Eclipse       | `eclipse-light-lite/standard/full`, `eclipse-dark-lite/standard/full`                                                    |
| Bolt          | `bolt-light`, `bolt-dark`                                                                                                |
| Vintage       | `vintage-light`, `vintage-dark`                                                                                          |
| Earth         | `default-earth-lite/standard/full`                                                                                       |
| OSM           | `positron`, `osm-bright`, `osm-basic`, `dark-matter`, `fiord-color`, `silver-osm`                                        |

---

## Key Design Decisions

1. **No native SDK dependency** — Use MapLibre for rendering + Ola REST APIs for data
2. **API-first approach** — Full ola-map-sdk API surface, then UI components on top
3. **React context pattern** — Provider with API key, hooks for data access
4. **Turbo Modules ready** — New Architecture compatible from day one
5. **bun for development** — Fast installs, native TypeScript support
6. **Minimal dependencies** — Use native `fetch`, avoid axios
