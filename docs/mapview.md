# `<MapView />` Component API

`MapView` wraps the MapLibre `Map` component (`@maplibre/maplibre-react-native` v11) with provider vector tile styles. It resolves its client from the `client` prop, the enclosing `IndiaMapsProvider`, or inline credentials, in that order.

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `apiKey` | `string` | Ola Maps API key (default provider), used when no `client` or provider context is available. |
| `accessToken` | `string` | Access token — accepted for both providers (`apiKey` alias), used when no `client` or provider context is available. |
| `provider` | `'ola' \| 'mappls'` | Backend provider, used when no `client` or provider context is available. Default `'ola'`. |
| `client` | `IndiaMapsClient` | Optional preconfigured client; takes precedence over credentials and context. |
| `styleName` | `MapStyle` | Style identifier. Default `default-light-standard`. |
| `initialRegion` | `LatLngInput & { zoomLevel? }` | Initial region; a convenience alternative to `initialCenter`/`initialZoom`. |
| `initialCenter` | `[lng, lat]` | Initial center coordinate (GeoJSON order). |
| `initialZoom` | `number` | Initial zoom level. Default `12`. |
| `cameraProps` | `object` | Extra props passed to the MapLibre `Camera` component. |
| `onMapReady` | `() => void` | Called when the map finishes loading. |

All other MapLibre `Map` props (`style`, `onRegionDidChange`, etc.) are passed through unchanged.

## Example

```tsx
import { MapView, Marker, Polyline } from 'react-native-india-maps';

<MapView
  style={{ flex: 1 }}
  styleName="default-light-standard"
  initialRegion={{ latitude: 28.6139, longitude: 77.209, zoomLevel: 12 }}
>
  <Marker id="delhi" coordinate={{ latitude: 28.6139, longitude: 77.209 }} />
  <Polyline
    id="route"
    coordinates={[
      [77.209, 28.6139],
      [77.22, 28.62],
    ]}
    color="#007AFF"
    width={3}
  />
</MapView>;
```

## How it works

- The `MapView` component uses `@maplibre/maplibre-react-native` v11 for rendering
- Style URLs are constructed from provider tile endpoints: `https://api.olamaps.io/tiles/vector/v1/styles/{styleName}/style.json`
- The API key is injected via the style URL query parameter
- React Native New Architecture is required by MapLibre v11
- No proprietary native SDKs are required

## Provider support

Rendering support differs between the two providers:

| Capability | Ola Maps | Mappls |
| --- | --- | --- |
| Vector style URL | Yes | **No** — Mappls publishes no public vector style endpoint |
| `getStyleURL()` return value | Full style URL | The bare style name, e.g. `default-light-standard` |
| Static map image | PNG / JPEG / WebP | **PNG only** — the still-image endpoint has no format parameter |
| REST APIs | Full | Full |

When `provider: 'mappls'`, `getStyleURL()` returns the style **name** rather than
a URL, because there is no public endpoint to fetch it from. Pass your own
MapLibre style object or a third-party raster style in that case:

```tsx
// Mappls has no public vector style endpoint — supply your own style.
<MapView style={myOwnStyleObject} style={{ flex: 1 }} />
```

For static images, requesting `format: 'jpeg'` under Mappls silently returns
PNG, because `/map/raster_tile/still_image` only emits 8-bit PNG.

## Available styles

Use the `MAP_STYLES` presets or any provider-specific style name:

```ts
import { MAP_STYLES } from 'react-native-india-maps';

// MAP_STYLES.lightStandard === 'default-light-standard'
<MapView styleName={MAP_STYLES.lightStandard} style={{ flex: 1 }} />;
```

Common presets:

- `MAP_STYLES.lightStandard` (`default-light-standard`) — Light theme, standard detail
- `MAP_STYLES.darkStandard` (`default-dark-standard`) — Dark theme, standard detail
- `MAP_STYLES.lightLite` (`default-light-lite`) — Light theme, minimal detail
- `MAP_STYLES.darkLite` (`default-dark-lite`) — Dark theme, minimal detail
- `MAP_STYLES.lightFull` (`default-light-full`) — Light theme, full detail
- `MAP_STYLES.eclipseLight` (`eclipse-light-standard`) — Eclipse theme, light
- `MAP_STYLES.eclipseDark` (`eclipse-dark-standard`) — Eclipse theme, dark
- `MAP_STYLES.boltLight` (`bolt-light`) — Bolt theme, light
- `MAP_STYLES.boltDark` (`bolt-dark`) — Bolt theme, dark
- `MAP_STYLES.vintageLight` (`vintage-light`) — Vintage theme, light
- `MAP_STYLES.vintageDark` (`vintage-dark`) — Vintage theme, dark
