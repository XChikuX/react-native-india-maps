# Mappls provider notes

`provider: 'mappls'` targets the Mappls (MapmyIndia) REST APIs. This page
records the behaviours that differ from Ola Maps, verified against the
canonical Mappls documentation repository and the published
`mappls-map-react-native` package.

The machine-readable contract for everything below is
[`mappls-apis-oas.yaml`](../mappls-apis-oas.yaml) in the repo root.

## Hosts

| Capability | Host |
| --- | --- |
| Search, geocoding, text search | `https://search.mappls.com` |
| Place details | `https://place.mappls.com` |
| Routing, distance matrix, optimization, snap-to-road | `https://route.mappls.com` |
| Elevation | `https://sdk.mappls.com` |
| Raster still-image tiles | `https://tile.mappls.com` |

Auth is the `access_token` query parameter, not `api_key`.

## Endpoints

These are the paths the current client constructs:

| Capability | Path |
| --- | --- |
| Autocomplete | `/search/places/autosuggest/json` |
| Geocode | `/search/address/geocode` |
| Reverse geocode | `/search/address/rev-geocode` |
| Place details | `/apis/O2O/entity/{eLoc}` |
| Nearby search | `/api/places/nearby/json` |
| Text search | `/api/places/textsearch/json` |
| Directions | `/route/direction/{resource}/{profile}/{geopositions}` |
| Distance matrix | `/route/dm/{resource}/{profile}/{geopositions}` |
| Route optimizer | `/route/optimization/{resource}/{profile}/{coordinates}` |
| Snap to road | `/route/movement/snapToRoad` |
| Elevation | `/map/utils/elevation` |
| Static map | `/map/raster_tile/still_image` |

### Search and place-details path generations

Mappls publishes overlapping REST contracts. Its current endpoint reference
lists `/api/places/nearby/json`, `/api/places/textsearch/json`, and
`/apis/O2O/entity/{eLoc}`, but labels those records **legacy-source evidence**;
their examples use `atlas.mapmyindia.com` / `explore.mapmyindia.com` and OAuth
Bearer authentication. The canonical REST repository documents newer
`/search/places/...` and `/O2O/entity/place-details/{eLoc}` routes using
`search.mappls.com` / `place.mappls.com` with `access_token` authentication.

The package currently retains the paths in the table above with its configured
Mappls hosts and query-token authentication. Do not change one path in isolation
from its host and authentication generation; verify the exact contract and
entitlement for the target Mappls account before migrating. The path segment by
itself is therefore not enough evidence to call the current request valid or
invalid end-to-end.

Sources: [Mappls endpoint reference](https://mapplsapi.com/api-reference?family=core-location),
[canonical Nearby REST guide](https://github.com/mappls-api/mappls-rest-apis/blob/main/mappls-maps-near-by-api-example/Readme.md),
[canonical Text Search REST guide](https://github.com/mappls-api/mappls-rest-apis/blob/main/mappls-textsearch-api/readme.md),
and [Place Detail API reference](https://mapplsapi.com/api-reference/core-location-get-apis-o2o-entity-eloc-place-detail-api).

## Differences from Ola Maps

### Travel modes

Mappls supports `trucking`, which Ola Maps does not. It does **not** support
`auto`.

| Mode | Ola Maps | Mappls |
| --- | --- | --- |
| `driving` | Yes | Yes |
| `walking` | Yes | Yes (directions & optimizer only) |
| `biking` | Yes (sent as `bike`) | Yes |
| `trucking` | No | Yes |
| `auto` | Yes | No |

`walking` is **not** offered by the Mappls distance-matrix endpoint. Use
`driving`, `biking` or `trucking` there.

### Profile × resource matrix

Mappls restricts which resources each profile may use. The client validates
these combinations before making a request: unsupported profiles throw
`UNSUPPORTED_ERROR`, while a profile/resource mismatch throws
`INVALID_INPUT_ERROR`.

**Directions**

| Profile | Allowed resources |
| --- | --- |
| `driving` | `route_adv`, `route_eta`, `route_traffic` |
| `biking` | `route_adv`, `route_traffic` |
| `walking` | `route_adv` |
| `trucking` | `route_adv`, `route_eta` |

**Distance matrix**

| Profile | Allowed resources |
| --- | --- |
| `driving` | `distance_matrix`, `distance_matrix_eta`, `distance_matrix_traffic` |
| `biking` | `distance_matrix` |
| `trucking` | `distance_matrix` |
| `walking` | not offered |

**Route optimizer**

| Profile | Allowed resources |
| --- | --- |
| `driving` | `trip_optimization`, `trip_optimization_eta`, `trip_optimization_traffic` |
| `biking` | `trip_optimization`, `trip_optimization_traffic` |
| `walking` | `trip_optimization` |
| `trucking` | `trip_optimization`, `trip_optimization_eta` |

The route optimizer defaults to `trip_optimization`, which is the neutral
no-traffic resource and works with `walking`. Choose an ETA/traffic resource
explicitly when you need it and the selected profile supports it.

`route_eta`, `route_traffic`, `trip_optimization_eta` and
`trip_optimization_traffic` are **India only**. The `biking`, `walking` and
`trucking` profiles do not accept `region` or `rtype`.

### Routing examples

```ts
import { IndiaMapsClient, IndiaMapsError } from 'react-native-india-maps';

const client = new IndiaMapsClient({
  provider: 'mappls',
  accessToken: 'YOUR_MAPPLS_TOKEN',
});

// Trucking is supported for directions and distance matrices.
const directions = await client.routing.getDirections('12.9,77.6', '13.0,77.7', {
  mode: 'trucking',
});
const matrix = await client.routing.getDistanceMatrix(['12.9,77.6'], ['13.0,77.7'], {
  mode: 'trucking',
});

// The default optimizer resource is trip_optimization (no traffic),
// which supports walking.
const walkingTrip = await client.routing.routeOptimizer(
  ['12.9,77.6', '13.0,77.7'],
  { mode: 'walking' }
);

// For a one-way trip, Mappls requires first -> last anchors.
const oneWayTrip = await client.routing.routeOptimizer(
  ['12.9,77.6', '13.0,77.7'],
  { roundTrip: false, source: 'first', destination: 'last' }
);

// Invalid combinations are rejected locally, before a provider request.
try {
  await client.routing.routeOptimizer(['12.9,77.6', '13.0,77.7'], {
    roundTrip: false,
  });
} catch (error) {
  if (error instanceof IndiaMapsError && error.code === 'INVALID_INPUT_ERROR') {
    console.error(error.message);
  } else {
    throw error;
  }
}
```

Set `resource: 'trip_optimization_eta'` explicitly for driving optimization
with Mappls live-traffic ETAs; this resource is India-only.

### Route optimizer: roundtrip / source / destination

Mappls does not support every combination of these three. Only these are
accepted:

| `roundtrip` | `source` | `destination` |
| --- | --- | --- |
| `true` | `first` | `last` |
| `true` | `first` | `any` |
| `true` | `any` | `last` |
| `true` | `any` | `any` |
| `false` | `first` | `last` |

So `roundTrip: false` only works together with `source: 'first'` and
`destination: 'last'`. Server defaults are `roundtrip=true`, `source=any`,
`destination=any`; the client rejects unsupported combinations locally with
`IndiaMapsError` code `INVALID_INPUT_ERROR`.

### Overview levels

`overview` accepts only `simplified` (default), `full`, or `false`. Omitting
the parameter requests the default; sending `true` is not valid.

### Response envelopes

The reverse-geocode endpoint returns `results` as an **array** in Mappls'
example response, and the published React Native SDK's
`ReverseGeoCodeModel.ts` also declares an array. Place details returns a **flat
object** with `eloc`, `name`, `address` and `type` at the top level — there is
no `results` wrapper.

### Limits

These are provider-side limits. The client does not prevalidate all of them;
Mappls may reject an out-of-range request with an API error.

| Endpoint | Limit |
| --- | --- |
| Distance matrix | 100 total points (sources + destinations) |
| Snap to road | 100 points |
| Autosuggest `query` | 45 characters |
| Nearby `radius` | 500–10000 meters |
| Static map `zoom` | 4–18 |

### Not available on Mappls

| Capability | Reason |
| --- | --- |
| Address validation | No public endpoint — use `geocode()` |
| Speed limits | No public endpoint |
| Nearest roads | Approximated via `snapToRoad()` |
| Vector tile styles | No public style endpoint |
| Non-PNG static maps | Still-image endpoint is PNG-only |

## Region

Mappls covers **238 countries**, and `region` is **mandatory outside India** on
autocomplete, geocode, reverse geocode, nearby search, text search, directions,
distance matrix and snap-to-road. It defaults to `IND`.

Valid values are ISO country codes listed in `countryISO.md` in the
[Mappls REST API repository](https://github.com/mappls-api/mappls-rest-apis).

> `region` is not exposed on this package's public API. Requests that require
> an explicit non-India region cannot currently be configured through this
> client; use the Mappls REST API directly with the required `region` until the
> SDK adds a typed option.

## Still-image endpoint

`/map/raster_tile/still_image` uses a different coordinate convention from the
Ola Maps static map API:

| | Ola Maps | Mappls |
| --- | --- | --- |
| Centre | `lng,lat` in the path | `lat,lng` as the `center` query param |
| Size | in the path (`/200x200.png`) | `size=200x200` query param |
| Format | extension in the path | PNG only, no parameter |
| Markers | `marker` | `markers` |

## Related

- [MapView](./mapview.md) — rendering and style support
- [Installation](./installation.md) — setup and MapLibre upgrades