/**
 * Jest config for integration tests.
 *
 * - `integration/localServer.test.ts` always runs: it exercises the full HTTP
 *   pipeline (URL building, auth injection, JSON serialization, error mapping)
 *   against a real in-process HTTP server on 127.0.0.1. No network access or
 *   credentials required.
 * - `integration/*.live.test.ts` hit the real Ola Maps and Mappls APIs and are
 *   skipped unless the matching environment variable is set:
 *
 *   OLA_MAPS_API_KEY=...          # enables olaMaps.live.test.ts
 *   MAPPLS_ACCESS_TOKEN=...       # enables mappls.live.test.ts
 *   OLA_MAPS_GEOFENCE_TESTS=1     # additionally enables the geofencing
 *                                 # round-trip (creates + deletes a fence)
 */
module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/integration/**/*.test.ts'],
  setupFiles: ['./test/jest.integration.setup.js'],
  modulePathIgnorePatterns: ['<rootDir>/lib/'],
  testTimeout: 30000,
};
