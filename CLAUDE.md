# CLAUDE.md - Development Guidelines

## Project Overview

`react-native-india-maps` is a React Native SDK for India Maps that provides:

1. A dual-provider REST API client supporting both **Ola Maps** and **Mappls** backends
2. Native map components powered by `@maplibre/maplibre-react-native`
3. Expo config plugin for location permissions
4. Full TypeScript types for all API surfaces

## Commands

```bash
# Install dependencies
bun install

# Build the library
bun run build

# Run tests
bun run test

# Lint
bun run lint

# Type check
bun run typecheck
```

## Architecture

- **`src/api/`** — HTTP-backed API modules (Places, Routing, Roads, Elevation, Geofencing, Tiles)
- **`src/components/`** — React Native components wrapping `@maplibre/maplibre-react-native`
- **`src/hooks/`** — React hooks for API access and state management
- **`src/providers/`** — React context providers for `IndiaMapsClient`
- **`src/types/`** — Shared TypeScript types (pure types only — no runtime helpers)
- **`src/utils/`** — Internal runtime helpers (coordinate conversion, config resolution, response parsing); not part of the public API
- **`plugin/`** — Expo config plugin for location permissions

## Conventions

- Use `bun` for dependency management and validation
- All API calls use direct HTTP via `fetch` — no native SDK bridge calls
- Dual-provider support: `provider: 'ola'` (default) or `provider: 'mappls'`
- Map rendering uses `@maplibre/maplibre-react-native` with Ola Maps vector tile styles
- Keep Expo support focused on development builds with config plugins, not Expo Go

## Providers

| Provider | Base URL | Auth Param | Notes |
| --- | --- | --- | --- |
| Ola Maps | `https://api.olamaps.io` | `api_key` | Default provider |
| Mappls | `https://search.mappls.com`, `https://place.mappls.com`, `https://route.mappls.com`, `https://sdk.mappls.com`, `https://tile.mappls.com` | `access_token` | Capabilities split across hosts |

| Capability | Ola Endpoint | Mappls Endpoint |
| --- | --- | --- |
| Autocomplete | `/places/v1/autocomplete` | `/search/places/autosuggest/json` |
| Geocode | `/places/v1/geocode` | `/search/address/geocode` |
| Reverse Geocode | `/places/v1/reverse-geocode` | `/search/address/rev-geocode` |
| Place Details | `/places/v1/details` | `/apis/O2O/entity/{eLoc}` |
| Nearby Search | `/places/v1/nearbysearch` | `/api/places/nearby/json` |
| Text Search | `/places/v1/textsearch` | `/api/places/textsearch/json` |
| Address Validation | `/places/v1/addressvalidation` | N/A (not public) |
| Directions | POST `/routing/v1/directions` (query params) | `/route/direction/{route_adv}/{profile}/{coords}` |
| Distance Matrix | GET `/routing/v1/distanceMatrix` (query params) | `/route/dm/{distance_matrix}/{profile}/{coords}` |
| Route Optimizer | POST `/routing/v1/routeOptimizer` (query params) | `/route/optimization/{resource}/{profile}/{coords}` |
| Snap to Road | `/routing/v1/snapToRoad` (`enhancePath`) | `/route/movement/snapToRoad` |
| Nearest Roads | `/routing/v1/nearestRoads` (requires `mode`) | N/A (approximated via snap-to-road) |
| Speed Limits | `/routing/v1/speedLimits` (`snapStrategy`) | N/A (not public) |
| Elevation | GET/POST `/places/v1/elevation` | `/map/utils/elevation` |
| Geofencing | `/places/v1/geofence`, `/places/v1/geofences` | N/A (not public) |
| Map Tiles | `/tiles/vector/v1/styles/{style}/style.json` | N/A (no public vector styles) |
| Static Map | `/tiles/v1/styles/{style}/static/{lon},{lat},{zoom}/{w}x{h}.{format}` | `/map/raster_tile/still_image` |

## Expo

- Expo Go is not supported because MapLibre requires native rendering
- Use the package config plugin from `app.plugin.js`
- The config plugin manages location permissions (Android + iOS)
- No native SDK files or Maven repos needed — MapLibre handles rendering
