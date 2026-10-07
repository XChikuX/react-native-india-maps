import { BaseApi } from './base';
import { IndiaMapsError } from '../errors';
import { arrayOf, asNumber, type Raw } from '../utils/parse';
import type {
  Geofence,
  GeofenceData,
  GeofenceListOptions,
  GeofencePage,
  GeofenceStatusResult,
} from '../types/geofencing';
import type { LatLngLiteral } from '../types/common';

const unsupported = (feature: string): IndiaMapsError =>
  new IndiaMapsError(
    `${feature} is not part of the public Mappls REST API. Use the dedicated InTouch APIs on your backend.`,
    'UNSUPPORTED_ERROR'
  );

/**
 * Geofencing API: CRUD for circular and polygon geofences plus inside/outside
 * checks. Ola Maps only — every method throws an {@linkcode IndiaMapsError}
 * with code `'UNSUPPORTED_ERROR'` when the configured provider is Mappls.
 */
export class GeofencingApi extends BaseApi {
  /**
   * Creates a geofence.
   *
   * @throws {@linkcode IndiaMapsError} on configuration, provider, network or
   * API failure.
   */
  async create(geofenceData: GeofenceData): Promise<Geofence> {
    this.requireAccessToken('GeofencingApi.create');
    if (this.provider === 'mappls') {
      throw unsupported('GeofencingApi.create');
    }
    return this.request<Geofence>(
      '/geofencing/v1/fences',
      {
        method: 'POST',
        body: geofenceData,
      },
      this.sdkTarget
    );
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
    return this.request<Geofence>(
      `/geofencing/v1/fences/${fenceId}`,
      undefined,
      this.sdkTarget
    );
  }

  /**
   * Updates a geofence.
   *
   * @throws {@linkcode IndiaMapsError} on configuration, provider, network or
   * API failure.
   */
  async update(
    fenceId: string,
    data: Partial<GeofenceData>
  ): Promise<Geofence> {
    this.requireAccessToken('GeofencingApi.update');
    if (this.provider === 'mappls') {
      throw unsupported('GeofencingApi.update');
    }
    return this.request<Geofence>(
      `/geofencing/v1/fences/${fenceId}`,
      {
        method: 'PUT',
        body: data,
      },
      this.sdkTarget
    );
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
    await this.request<void>(
      `/geofencing/v1/fences/${fenceId}`,
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
    const response = await this.request<Raw>(
      '/geofencing/v1/fences',
      {
        params: {
          project_id: projectId,
          page: options?.page,
          limit: options?.limit,
        },
      },
      this.sdkTarget
    );
    return {
      fences: arrayOf(response.fences) as Geofence[],
      total: asNumber(response.total),
      page: options?.page,
      limit: options?.limit,
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
    return this.request<GeofenceStatusResult>(
      `/geofencing/v1/fences/${fenceId}/status`,
      {
        params: { lat: location.lat, lng: location.lng },
      },
      this.sdkTarget
    );
  }
}
