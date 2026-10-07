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

| Capability | Path |
| --- | --- |
| Autocomplete | `/search/places/autosuggest/json` |
| Geocode | `/search/address/geocode` |
| Reverse geocode | `/search/address/rev-geocode` |
| Place details | `/O2O/entity/place-details/{eLoc}` |
| Nearby search | `/search/places/nearby/json` |
| Text search | `/search/places/textsearch/json` |
| Directions | `/route/direction/{resource}/{profile}/{geopositions}` |
| Distance matrix | `/route/dm/{resource}/{profile}/{geopositions}` |
| Route optimizer | `/route/optimization/{resource}/{profile}/{coordinates}` |
| Snap to road | `/route/movement/snapToRoad` |
| Elevation | `/map/utils/elevation` |
| Static map | `/map/raster_tile/still_image` |

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

Mappls restricts which resources each profile may use. Requesting an
unsupported combination returns an error.

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

`route_eta`, `route_traffic`, `trip_optimization_eta` and
`trip_optimization_traffic` are **India only**. The `biking`, `walking` and
`trucking` profiles do not accept `region` or `rtype`.

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
`destination=any`.

### Overview levels

`overview` accepts only `simplified` (default), `full`, or `false`. Omitting
the parameter requests the default; sending `true` is not valid.

### Response envelopes

The reverse-geocode endpoint returns `results` as a **single object**, not an
array. Place details returns a **flat object** with `eloc`, `name`, `address`
and `type` at the top level — there is no `results` wrapper.

### Limits

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

> `region` is not yet exposed as an option on this package's public types. For
> requests outside India you currently need to set it yourself.

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