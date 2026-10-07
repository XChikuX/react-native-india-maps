# Installation

```sh
bun add react-native-india-maps @maplibre/maplibre-react-native@^11.5.0
```

## Requirements

- React `>=19.2.0`
- React Native `>=0.83.0`
- `@maplibre/maplibre-react-native` `>=11.2.0` (latest stable `11.5.0`, checked 2026-10-07)
- Expo SDK 55+ development build or bare React Native app
- React Native New Architecture enabled
- Ola Maps API key or Mappls access token

## Staying up to date

`@maplibre/maplibre-react-native` is a **peer dependency**, so your app controls
the installed version. The npm `latest` dist-tag resolved to `11.5.0` when
checked on 2026-10-07. Check for updates with:

```sh
bun outdated @maplibre/maplibre-react-native
bun add @maplibre/maplibre-react-native@latest
```

Two things to know before upgrading:

- **v11 is the new-architecture-only line.** It was the first release to drop
  legacy-architecture support, so there is no v10 fallback.
- **Verify after upgrading.** MapLibre occasionally changes component props and
  native config. Run `bun run typecheck` and check the release notes at
  [github.com/maplibre/maplibre-react-native/releases](https://github.com/maplibre/maplibre-react-native/releases).

This package only depends on MapLibre's public surface — `MapView`, `Camera`,
`Marker`, `ShapeSource` and `LineLayer` — so most minor upgrades are drop-in.

## Expo plugin

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

The plugin handles:
- Android: `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` permissions (+ `ACCESS_BACKGROUND_LOCATION` if `backgroundLocation: true`)
- iOS: `NSLocationWhenInUseUsageDescription` (+ `NSLocationAlwaysAndWhenInUseUsageDescription` if `backgroundLocation: true`)

No native SDK configuration files, Maven repositories, or Gradle plugins are needed — MapLibre handles all rendering natively.

## Provider

```tsx
import { IndiaMapsProvider, IndiaMapsClient } from 'react-native-india-maps';

// Ola Maps (default)
const client = new IndiaMapsClient({ apiKey: 'YOUR_OLA_MAPS_API_KEY' });

// Or Mappls
// const client = new IndiaMapsClient({ accessToken: 'YOUR_MAPPLS_TOKEN', provider: 'mappls' });

<IndiaMapsProvider client={client}>
  <App />
</IndiaMapsProvider>;
```

## Which provider?

| | Ola Maps (default) | Mappls |
| --- | --- | --- |
| Autocomplete, geocoding, nearby, text search | Yes | Yes |
| Directions, distance matrix, route optimizer | Yes | Yes |
| Snap to road | Yes | Yes |
| Elevation | Yes | Yes |
| Truck routing (`mode: 'trucking'`) | No | Yes |
| Address validation | Yes | No |
| Speed limits | Yes | No |
| Vector tile style URL | Yes | No |
| Non-PNG static maps | Yes | No |
| Coverage | India | 238 countries (needs `region` outside India) |

See [Mappls provider notes](./mappls.md) for the full list of Mappls
differences, including per-profile resource restrictions and request limits.

## Important

- Expo Go is not supported — MapLibre requires native rendering
- MapLibre v11 only supports the React Native New Architecture
- No `.conf` or `.olf` files are needed (those were Mappls native SDK artifacts)
- The map rendering is fully handled by `@maplibre/maplibre-react-native`
