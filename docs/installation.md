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

The MapLibre plugin configures the native MapLibre integration, including the iOS Podfile setup; keep it alongside this package's plugin. The India Maps plugin handles:
- Android: `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` permissions (+ `ACCESS_BACKGROUND_LOCATION` if `backgroundLocation: true`)
- iOS: `NSLocationWhenInUseUsageDescription` (+ `NSLocationAlwaysAndWhenInUseUsageDescription` if `backgroundLocation: true`)

No native SDK configuration files, Maven repositories, or Gradle plugins are needed — MapLibre handles all rendering natively.

## Runtime API credentials

The config plugin only configures native location permissions and usage descriptions. It does not need, read, or write Ola Maps or Mappls credentials. The `.conf` and `.olf` files used by Mappls's native SDK are not used by this package; MapLibre renders the map, while this SDK uses provider credentials for runtime REST requests.

You can provide the credential directly at runtime; environment variables are optional. For example, pass an app-provided value to the provider:

```tsx
import { IndiaMapsProvider } from 'react-native-india-maps';

export function MapsRoot({ apiKey }: { apiKey: string }) {
  return (
    <IndiaMapsProvider apiKey={apiKey}>
      <MapScreen />
    </IndiaMapsProvider>
  );
}
```

For Mappls, pass `accessToken={token}` and `provider="mappls"` instead. You can also create an `IndiaMapsClient` with a runtime value and pass it through the provider's `client` prop. If a credential is refreshed, supply the new value or replace the client. The value is still available to the running app and is sent with its API requests; runtime injection does not make a client-side credential confidential.

If you prefer Expo to populate the value at bundle time, create `.env.local` in your app:

```env
EXPO_PUBLIC_OLA_MAPS_API_KEY=your-ola-maps-api-key
# Or, for Mappls:
EXPO_PUBLIC_MAPPLS_ACCESS_TOKEN=your-mappls-access-token
```

Read these variables using direct dot notation, such as `process.env.EXPO_PUBLIC_OLA_MAPS_API_KEY`, then pass the value to `IndiaMapsProvider` or `IndiaMapsClient`. Expo does not inline dynamic lookups such as `process.env[name]`. Keep `.env.local` out of version control (for example, add `.env*.local` to your app's `.gitignore`).

For EAS Build or EAS Update, define the matching `EXPO_PUBLIC_` variable in the EAS environment used by that build or update. With Expo SDK 55+, select the environment for updates explicitly, for example `eas update --environment production`. These values are embedded in the application JavaScript bundle and can be inspected by app users: **they are not confidential secrets**. Restrict provider credentials according to the provider's available controls. If a credential must remain private, make provider requests through a backend you control instead of embedding it in a mobile app. See Expo's [environment variable guide](https://docs.expo.dev/guides/environment-variables/) and [EAS environment variable guide](https://docs.expo.dev/eas/environment-variables/).

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
