import type { LatLngLiteral } from './common';

/** Geofence boundary shape. */
export type GeofenceType = 'circle' | 'polygon';

/** Circular geofence boundary. */
export type GeofenceCircle = {
  type: 'circle';

  /** Circle center. */
  center: LatLngLiteral;

  /** Circle radius in meters. */
  radius: number;
};

/** Polygonal geofence boundary. */
export type GeofencePolygon = {
  type: 'polygon';

  /** Polygon vertices; the closing point is implicit. */
  coordinates: LatLngLiteral[];
};

/**
 * Geofence boundary. A discriminated union so the fields always match the
 * {@linkcode GeofenceType}: use `radius` with `'circle'` and `coordinates`
 * with `'polygon'`.
 */
export type GeofenceGeometry = GeofenceCircle | GeofencePolygon;

/** Payload for creating or updating a geofence. */
export type GeofenceData = {
  /** Human-readable geofence name. */
  name: string;

  /** Ola Maps project the fence belongs to. */
  projectId: string;

  /** Fence boundary shape. */
  geometry: GeofenceGeometry;

  /** Arbitrary string metadata stored with the fence. */
  metadata?: Record<string, string>;
};

/** A stored geofence returned by the geofencing API. */
export type Geofence = GeofenceData & {
  /** Server-assigned fence identifier. */
  fenceId: string;

  /** Creation timestamp, when the provider reports one. */
  createdAt?: string;

  /** Last-update timestamp, when the provider reports one. */
  updatedAt?: string;
};

/** Options accepted by {@linkcode GeofencingApi.list}. */
export type GeofenceListOptions = {
  /** 1-based page number to fetch. */
  page?: number;

  /** Maximum number of fences to return per page. */
  limit?: number;
};

/** One page of geofences returned by {@linkcode GeofencingApi.list}. */
export type GeofencePage = {
  /** Geofences on this page. */
  fences: Geofence[];

  /** Total number of geofences across all pages, when reported. */
  total?: number;

  /** Requested page number. */
  page?: number;

  /** Requested page size. */
  limit?: number;
};

/** Result of {@linkcode GeofencingApi.checkStatus}. */
export type GeofenceStatusResult = {
  /** Fence that was checked. */
  fenceId: string;

  /** Whether the point lies inside the fence. */
  status: 'inside' | 'outside';

  /** Distance in meters from the boundary, when reported. */
  distance?: number;
};
