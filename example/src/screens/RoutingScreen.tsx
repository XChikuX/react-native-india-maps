import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type {
  DirectionsResult,
  DistanceMatrixResult,
  LatLngString,
  RouteOptimizerResult,
  TravelMode,
} from 'react-native-india-maps';
import { MapView, Polyline, useIndiaMaps } from 'react-native-india-maps';

import {
  AppButton,
  Chips,
  ErrorText,
  InfoBox,
  JsonBlock,
  LabeledInput,
  Screen,
  Section,
  SummaryRow,
} from '../components/ui';
import { theme } from '../theme';
import { decodePolyline } from '../utils/polyline';

const MODES: readonly TravelMode[] = [
  'driving',
  'biking',
  'walking',
  'auto',
  'trucking',
];

const OPTIMIZER_STOPS = [
  { latitude: 12.9716, longitude: 77.5946 }, // Bengaluru center
  { latitude: 12.9352, longitude: 77.6245 }, // Koramangala
  { latitude: 12.9784, longitude: 77.6408 }, // Indiranagar
  { latitude: 13.0298, longitude: 77.5409 }, // Rajajinagar
];

const formatKm = (meters?: number) =>
  meters === undefined ? '—' : `${(meters / 1000).toFixed(1)} km`;

const formatMinutes = (seconds?: number) =>
  seconds === undefined ? '—' : `${Math.round(seconds / 60)} min`;

const LATLNG_PATTERN = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;

/** Validates a "lat,lng" input, falling back to the Bengaluru center. */
const asLatLng = (value: string, fallback: LatLngString): LatLngString =>
  LATLNG_PATTERN.test(value.trim())
    ? (value.trim().replace(/ /g, '') as LatLngString)
    : fallback;

const ORIGIN_DEFAULT = '12.9716,77.5946' as LatLngString;
const DESTINATION_DEFAULT = '12.9352,77.6245' as LatLngString;

/**
 * Routing demos: directions drawn on the map, distance matrix and the route
 * optimizer.
 */
export function RoutingScreen() {
  const client = useIndiaMaps();
  const [origin, setOrigin] = useState('12.9716,77.5946');
  const [destination, setDestination] = useState('12.9352,77.6245');
  const [mode, setMode] = useState<TravelMode>('driving');
  const [directions, setDirections] = useState<DirectionsResult>();
  const [matrix, setMatrix] = useState<DistanceMatrixResult>();
  const [optimized, setOptimized] = useState<RouteOptimizerResult>();
  const [error, setError] = useState<Error>();

  const run = async (action: () => Promise<void>) => {
    setError(undefined);
    try {
      await action();
    } catch (runError) {
      setError(
        runError instanceof Error ? runError : new Error(String(runError))
      );
    }
  };

  const doDirections = () =>
    run(async () => {
      const result = await client.routing.getDirections(
        asLatLng(origin, ORIGIN_DEFAULT),
        asLatLng(destination, DESTINATION_DEFAULT),
        {
          mode,
        }
      );
      setDirections(result);
    });

  const doMatrix = () =>
    run(async () => {
      setMatrix(
        await client.routing.getDistanceMatrix(
          [asLatLng(origin, ORIGIN_DEFAULT)],
          [asLatLng(destination, DESTINATION_DEFAULT)],
          {
            mode,
          }
        )
      );
    });

  const doOptimizer = () =>
    run(async () => {
      setOptimized(
        await client.routing.routeOptimizer(OPTIMIZER_STOPS, {
          mode: 'driving',
          roundTrip: false,
        })
      );
    });

  const route = directions?.routes[0];
  const routeCoordinates =
    route?.geometry !== undefined ? decodePolyline(route.geometry) : undefined;
  const originCoord = asLatLng(origin, ORIGIN_DEFAULT).split(',');
  const destinationCoord = asLatLng(destination, DESTINATION_DEFAULT).split(
    ','
  );
  const midPoint = {
    latitude: (Number(originCoord[0]) + Number(destinationCoord[0])) / 2,
    longitude: (Number(originCoord[1]) + Number(destinationCoord[1])) / 2,
  };

  return (
    <Screen>
      <Section hint="Coordinates as lat,lng" title="Inputs">
        <LabeledInput
          autoCapitalize="none"
          label="Origin (lat,lng)"
          onChangeText={setOrigin}
          value={origin}
        />
        <LabeledInput
          autoCapitalize="none"
          label="Destination (lat,lng)"
          onChangeText={setDestination}
          value={destination}
        />
        <Chips onChange={setMode} options={MODES} value={mode} />
        <InfoBox>
          'auto' is Ola Maps only; 'trucking' is Mappls only. Expect an
          UNSUPPORTED_ERROR when the active provider does not support a mode.
        </InfoBox>
      </Section>

      <Section
        hint="client.routing.getDirections — the best route is drawn on the map."
        title="Directions"
      >
        <AppButton onPress={doDirections} title="Get directions" />
        <ErrorText error={error} />
        {route ? (
          <>
            <SummaryRow label="Distance" value={formatKm(route.distance)} />
            <SummaryRow
              label="Duration"
              value={formatMinutes(route.duration)}
            />
            <SummaryRow
              label="Alternatives"
              value={String((directions?.routes.length ?? 1) - 1)}
            />
            <SummaryRow
              label="Steps (leg 1)"
              value={String(route.legs?.[0]?.steps?.length ?? 0)}
            />
            <View style={styles.mapFrame}>
              <MapView
                initialRegion={{ ...midPoint, zoomLevel: 12 }}
                style={styles.map}
              >
                {routeCoordinates && routeCoordinates.length > 1 ? (
                  <Polyline
                    color="#2563eb"
                    coordinates={routeCoordinates}
                    id="route"
                    width={5}
                  />
                ) : null}
              </MapView>
            </View>
          </>
        ) : null}
      </Section>

      <Section
        hint="client.routing.getDistanceMatrix between the origin and destination."
        title="Distance matrix"
      >
        <AppButton onPress={doMatrix} title="Get distance matrix" />
        <JsonBlock data={matrix} />
      </Section>

      <Section
        hint="Four preset stops in Bengaluru; the SDK reports the visit order."
        title="Route optimizer"
      >
        <AppButton onPress={doOptimizer} title="Optimize stops" />
        {optimized ? (
          <>
            <SummaryRow
              label="Visit order (indices)"
              value={optimized.order?.join(' → ') ?? '—'}
            />
            <SummaryRow label="Distance" value={formatKm(optimized.distance)} />
            <SummaryRow
              label="Duration"
              value={formatMinutes(optimized.duration)}
            />
          </>
        ) : null}
        <JsonBlock data={optimized?.order} />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  mapFrame: {
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    height: 220,
    overflow: 'hidden',
  },
});
