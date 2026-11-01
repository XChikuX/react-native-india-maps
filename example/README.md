# Example app

An Expo development-build app demonstrating every feature of
`react-native-india-maps`:

| Tab | What it shows |
| --- | --- |
| **map** | `MapView` with Ola Maps styles, `Marker` + `Callout`, `Polygon`, `Polyline`, `UserLocation` |
| **places** | `useAutocomplete` hook (live, debounced), geocode, reverse geocode, nearby search, text search, place details, address validation (Ola) |
| **routing** | `getDirections` with the route drawn on a map, distance matrix, route optimizer |
| **geofencing** | Create / get / list / check / update / delete a circular fence (Ola) |
| **utilities** | Elevation, multi-elevation, snap to road, speed limits, style URLs, `getTransformRequest`, static map image |

The header lets you switch between the **Ola Maps** and **Mappls** providers at
runtime; provider-specific features show a notice instead of failing silently.

## Setup

Requires [bun](https://bun.sh) and an Expo development environment
(Xcode / Android Studio). Expo Go is **not** supported because MapLibre
requires native rendering.

```sh
# 1. Build the library first (the example consumes it via file:..)
cd ..            # repository root
bun install
bun run build

# 2. Install example dependencies
cd example
bun install

# 3. Configure credentials (see below)
cp .env.local.example .env.local   # or create it manually

# 4. Run a development build
bun run ios       # or: bun run android
```

If dependency versions drift (the example pins the versions the library is
tested against), align them with:

```sh
bunx expo install --fix
```

## Credentials

The app reads credentials from Expo public environment variables:

```env
# .env.local — do not commit
EXPO_PUBLIC_OLA_MAPS_API_KEY=your-ola-maps-api-key
# and/or
EXPO_PUBLIC_MAPPLS_ACCESS_TOKEN=your-mappls-access-token
```

- Get an Ola Maps key at <https://olamaps.io> (API keys section).
- Get a Mappls token at <https://apis.mappls.com>.

Without credentials, every API call fails with a `CONFIGURATION_ERROR` and
Ola Maps tile styles may not load — configure at least one credential for the
full experience. These values are embedded in the JS bundle — treat them as
non-confidential and restrict them in the provider dashboard.

## Switching providers

Use the chips in the header. The provider defaults to whichever credential is
present (`mappls` when only its token is configured). Screens remount on
switch so no demo state leaks between providers.

Provider differences visible in the app:

- Mappls has no public vector tile styles → the map tab canvas stays empty.
- Geofencing, speed limits and address validation are Ola-only.
- `trucking` routing mode is Mappls-only; `auto` is Ola-only.

## Project layout

```
example/
├── app.json              # Expo config with both config plugins
├── index.ts              # Expo entry
└── src/
    ├── App.tsx           # Provider + tab shell, provider switcher
    ├── theme.ts          # Shared colors/spacing
    ├── components/ui.tsx # Buttons, chips, JSON blocks, inputs…
    ├── utils/polyline.ts # Encoded-polyline decoder for route drawing
    └── screens/          # One screen per capability
```
