import { BaseApi } from './base';
import { IndiaMapsError } from '../errors';
import {
  arrayOf,
  asNumber,
  asString,
  toLatLngLiteral,
  type Raw,
} from '../utils/parse';
import type {
  Geofence,
  GeofenceData,
  GeofenceGeometry,
  GeofenceListOptions,
  GeofencePage,
  GeofenceStatus,
  GeofenceStatusResult,
  GeofenceWriteResult,
} from '../types/geofencing';
import type { LatLngLiteral } from '../types/common';

const unsupported = (feature: string): IndiaMapsError =>
  new IndiaMapsError(
    `${feature} is not part of the public Mappls REST API. Use the dedicated InTouch APIs on your backend.`,
    'UNSUPPORTED_ERROR'
  );

/** Serializes SDK geofence data into the provider request payload. */
const toWireRequest = (data: GeofenceData): Raw => {
  const base: Raw = {
    name: data.name,
    status: data.status ?? 'active',
    projectId: data.projectId,
  };
  if (data.geometry.type === 'circle') {
    return {
      ...base,
      type: 'circle',
      radius: data.geometry.radius,
      coordinates: [[data.geometry.center.lat, data.geometry.center.lng]],
    };
  }
  return {
    ...base,
    type: 'polygon',
    coordinates: data.geometry.coordinates.map((point) => [
      point.lat,
      point.lng,
    ]),
  };
};

/** Reads a `[latitude, longitude]` provider pair. */
const toLatLngPair = (value: unknown): LatLngLiteral | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }
  return toLatLngLiteral(value[0], value[1]);
};

const toGeofenceStatus = (value: unknown): GeofenceStatus | undefined => {
  return value === 'active' || value === 'inactive' ? value : undefined;
};

/** Normalizes a provider geofence payload into a {@linkcode Geofence}. */
const normalizeGeofence = (response: unknown): Geofence => {
  const raw = (response ?? {}) as Raw;
  const pairs = arrayOf(raw.coordinates)
    .map(toLatLngPair)
    .filter((point): point is LatLngLiteral => point !== undefined);
  const type = asString(raw.type);

  let geometry: GeofenceGeometry;
  if (type === 'polygon') {
    geometry = { type: 'polygon', coordinates: pairs };
  } else {
    const center = pairs[0];
    if (center === undefined) {
      throw new IndiaMapsError(
        'Geofencing API returned a circle without a center coordinate.',
        'PARSE_ERROR'
      );
    }
    geometry = { type: 'circle', center, radius: asNumber(raw.radius) ?? 0 };
  }

  const fenceId = asString(raw.geofenceId);
  if (fenceId === undefined) {
    throw new IndiaMapsError(
      'Geofencing API returned a geofence without an identifier.',
      'PARSE_ERROR'
    );
  }

  return {
    fenceId,
    name: asString(raw.name) ?? '',
    projectId: asString(raw.projectId) ?? '',
    geometry,
    status: toGeofenceStatus(raw.status),
  };
};

/** Normalizes a create/update/delete acknowledgment. */
const normalizeWriteResult = (response: unknown): GeofenceWriteResult => {
  const raw = (response ?? {}) as Raw;
  const fenceId = asString(raw.geofenceId);
  if (fenceId === undefined) {
    throw new IndiaMapsError(
      'Geofencing API did not return a geofence identifier.',
      'PARSE_ERROR'
    );
  }
  return { fenceId, message: asString(raw.message) };
};

/**
 * Geofencing API: CRUD for circular and polygon geofences plus inside/outside
 * checks. Ola Maps only — every method throws an {@linkcode IndiaMapsError}
 * with code `'UNSUPPORTED_ERROR'` when the configured provider is Mappls.
 */
export class GeofencingApi extends BaseApi {
  /**
   * Creates a geofence and returns its assigned identifier.
   *
   * @throws {@linkcode IndiaMapsError} on configuration, provider, network or
   * API failure.
   */
  async create(geofenceData: GeofenceData): Promise<GeofenceWriteResult> {
    this.requireAccessToken('GeofencingApi.create');
    if (this.provider === 'mappls') {
      throw unsupported('GeofencingApi.create');
    }
    const response = await this.request<Raw>(
      '/places/v1/geofence',
      {
        method: 'POST',
        body: toWireRequest(geofenceData),
      },
      this.sdkTarget
    );
    return normalizeWriteResult(response);
  }

  /**
   * Returns a geofence by identifier.
   *
   * @throws {@linkcode IndiaMapsError} on configuration, provider, network or
   * API failure.
   */
  async getById(fenceId: string): Promise<Geofence> {
    this.requireAccessToken('GeofencingApi.getById');
    if (this.provider === 'mappls') {
      throw unsupported('GeofencingApi.getById');
    }
    const response = await this.request<Raw>(
      `/places/v1/geofence/${encodeURIComponent(fenceId)}`,
      undefined,
      this.sdkTarget
    );
    return normalizeGeofence(response);
  }

  /**
   * Replaces the definition of an existing geofence. Ola Maps updates are
   * full-object replacements, so `data` carries the complete fence payload.
   *
   * @throws {@linkcode IndiaMapsError} on configuration, provider, network or
   * API failure.
   */
  async update(
    fenceId: string,
    data: GeofenceData
  ): Promise<GeofenceWriteResult> {
    this.requireAccessToken('GeofencingApi.update');
    if (this.provider === 'mappls') {
      throw unsupported('GeofencingApi.update');
    }
    const response = await this.request<Raw>(
      `/places/v1/geofence/${encodeURIComponent(fenceId)}`,
      {
        method: 'PUT',
        body: toWireRequest(data),
      },
      this.sdkTarget
    );
    return normalizeWriteResult(response);
  }

  /**
   * Deletes a geofence.
   *
   * @throws {@linkcode IndiaMapsError} on configuration, provider, network or
   * API failure.
   */
  async deleteById(fenceId: string): Promise<void> {
    this.requireAccessToken('GeofencingApi.deleteById');
    if (this.provider === 'mappls') {
      throw unsupported('GeofencingApi.deleteById');
    }
    await this.request<unknown>(
      `/places/v1/geofence/${encodeURIComponent(fenceId)}`,
      {
        method: 'DELETE',
      },
      this.sdkTarget
    );
  }

  /**
   * Returns one page of geofences for a project.
   *
   * @throws {@linkcode IndiaMapsError} on configuration, provider, network or
   * API failure.
   */
  async list(
    projectId: string,
    options?: GeofenceListOptions
  ): Promise<GeofencePage> {
    this.requireAccessToken('GeofencingApi.list');
    if (this.provider === 'mappls') {
      throw unsupported('GeofencingApi.list');
    }
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 10;
    const response = await this.request<Raw>(
      '/places/v1/geofences',
      {
        params: { projectId, page, size: pageSize },
      },
      this.sdkTarget
    );
    return {
      fences: arrayOf(response.geofences).map(normalizeGeofence),
      total: asNumber(response.total),
      page: asNumber(response.page) ?? page,
      pageSize: asNumber(response.size) ?? pageSize,
    };
  }

  /**
   * Checks whether a coordinate lies inside a geofence.
   *
   * @throws {@linkcode IndiaMapsError} on configuration, provider, network or
   * API failure.
   */
  async checkStatus(
    fenceId: string,
    location: LatLngLiteral
  ): Promise<GeofenceStatusResult> {
    this.requireAccessToken('GeofencingApi.checkStatus');
    if (this.provider === 'mappls') {
      throw unsupported('GeofencingApi.checkStatus');
    }
    const response = await this.request<Raw>(
      '/places/v1/geofence/status',
      {
        params: {
          geofenceId: fenceId,
          coordinates: `${location.lat},${location.lng}`,
        },
      },
      this.sdkTarget
    );
    const raw = (response ?? {}) as Raw;
    return {
      fenceId: asString(raw.geofenceId) ?? fenceId,
      isInside: raw.isInside === true,
      message: asString(raw.message),
    };
  }
}
