import type { LatLngLiteral } from './common';

/** Geofence boundary shape. */
export type GeofenceType = 'circle' | 'polygon';

/** Activation state of a geofence. */
export type GeofenceStatus = 'active' | 'inactive';

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

  /** Initial activation state. @default 'active' */
  status?: GeofenceStatus;
};

/** A stored geofence returned by {@linkcode GeofencingApi.getById}. */
export type Geofence = {
  /** Server-assigned fence identifier. */
  fenceId: string;

  /** Human-readable geofence name. */
  name: string;

  /** Ola Maps project the fence belongs to. */
  projectId: string;

  /** Fence boundary shape. */
  geometry: GeofenceGeometry;

  /** Activation state, when reported. */
  status?: GeofenceStatus;
};

/**
 * Acknowledgment returned by {@linkcode GeofencingApi.create},
 * {@linkcode GeofencingApi.update} and {@linkcode GeofencingApi.deleteById}.
 */
export type GeofenceWriteResult = {
  /** Identifier of the fence that was created or modified. */
  fenceId: string;

  /** Provider confirmation text, when reported. */
  message?: string;
};

/** Options accepted by {@linkcode GeofencingApi.list}. */
export type GeofenceListOptions = {
  /** 1-based page number to fetch. @default 1 */
  page?: number;

  /** Number of fences per page. @default 10 */
  pageSize?: number;
};

/** One page of geofences returned by {@linkcode GeofencingApi.list}. */
export type GeofencePage = {
  /** Geofences on this page. */
  fences: Geofence[];

  /** Total number of geofences across all pages, when reported. */
  total?: number;

  /** Page number that was fetched. */
  page: number;

  /** Page size that was requested. */
  pageSize: number;
};

/** Result of {@linkcode GeofencingApi.checkStatus}. */
export type GeofenceStatusResult = {
  /** Fence that was checked. */
  fenceId: string;

  /** Whether the point lies inside the fence. */
  isInside: boolean;

  /** Provider explanation text, when reported. */
  message?: string;
};
