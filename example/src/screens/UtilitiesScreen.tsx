import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type {
  ElevationResult,
  MultiElevationResult,
  SnapToRoadResult,
  SpeedLimitsResult,
} from 'react-native-india-maps';
import { useIndiaMaps } from 'react-native-india-maps';

import {
  AppButton,
  ErrorText,
  InfoBox,
  JsonBlock,
  Screen,
  Section,
  SummaryRow,
} from '../components/ui';
import { theme } from '../theme';

const LEH = { latitude: 34.1526, longitude: 77.5771 };

const TRAIL = [
  { latitude: 12.9716, longitude: 77.5946 },
  { latitude: 12.9724, longitude: 77.5965 },
  { latitude: 12.9741, longitude: 77.5988 },
];

/**
 * Utility demos: elevation, snap to road, speed limits, style URLs and static
 * map images.
 */
export function UtilitiesScreen() {
  const client = useIndiaMaps();
  const isOla = client.config.provider !== 'mappls';

  const [elevation, setElevation] = useState<ElevationResult>();
  const [multiElevation, setMultiElevation] = useState<MultiElevationResult>();
  const [snapped, setSnapped] = useState<SnapToRoadResult>();
  const [speedLimits, setSpeedLimits] = useState<SpeedLimitsResult>();
  const [staticMapUrl, setStaticMapUrl] = useState<string>();
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

  const doElevation = () =>
    run(async () => {
      setElevation(await client.elevation.getElevation(LEH));
    });

  const doMultiElevation = () =>
    run(async () => {
      setMultiElevation(
        await client.elevation.getMultiElevation([
          LEH,
          { latitude: 12.9716, longitude: 77.5946 },
          { latitude: 28.6139, longitude: 77.209 },
        ])
      );
    });

  const doSnap = () =>
    run(async () => {
      setSnapped(await client.roads.snapToRoad(TRAIL, true));
    });

  const doSpeedLimits = () =>
    run(async () => {
      setSpeedLimits(
        await client.roads.speedLimits(TRAIL, {
          snapStrategy: 'nearest-road',
        })
      );
    });

  const doStaticMap = () =>
    run(async () => {
      setStaticMapUrl(
        client.tiles.getStaticMapURL({
          center: [77.5946, 12.9716],
          height: 320,
          markers: [{ latitude: 12.9716, longitude: 77.5946 }],
          width: 480,
          zoom: 13,
        })
      );
    });

  const styleUrl = client.tiles.getStyleURL();
  const transformRequest = client.tiles.getTransformRequest();
  const transformedUrl = transformRequest(
    'https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/0/0/0.png'
  ).url;

  return (
    <Screen>
      <Section
        hint="Elevation of Leh, Ladakh — expect a few thousand meters."
        title="Elevation"
      >
        <AppButton onPress={doElevation} title="Get elevation (Leh)" />
        <AppButton onPress={doMultiElevation} title="Get multi elevation" />
        <ErrorText error={error} />
        {elevation ? (
          <SummaryRow
            label="Leh elevation"
            value={`${elevation.elevation.toFixed(0)} m`}
          />
        ) : null}
        <JsonBlock data={multiElevation} />
      </Section>

      <Section
        hint="Snaps a short GPS trail near Bengaluru center onto the road network."
        title="Snap to road"
      >
        <AppButton onPress={doSnap} title="Snap trail" />
        <JsonBlock data={snapped?.snappedPoints} />
      </Section>

      {isOla ? (
        <Section hint="Ola Maps only" title="Speed limits">
          <AppButton onPress={doSpeedLimits} title="Get speed limits" />
          <JsonBlock data={speedLimits?.speedLimits} />
        </Section>
      ) : null}

      <Section
        hint="client.tiles.getStyleURL / getTransformRequest for MapLibre."
        title="Tiles & styles"
      >
        {isOla ? (
          <>
            <LabeledUrl label="Style URL" url={styleUrl} />
            <LabeledUrl label="Transformed tile URL" url={transformedUrl} />
          </>
        ) : (
          <InfoBox tone="warn">
            Mappls has no public vector styles, so the style URL is just the
            style name: '{styleUrl}'.
          </InfoBox>
        )}
      </Section>

      <Section
        hint="Builds a static map image URL and renders it in an Image view."
        title="Static map"
      >
        <AppButton onPress={doStaticMap} title="Build static map URL" />
        {staticMapUrl ? <LabeledUrl label="URL" url={staticMapUrl} /> : null}
        {staticMapUrl ? (
          <Image
            accessibilityLabel="Static map preview"
            resizeMode="cover"
            source={{ uri: staticMapUrl }}
            style={styles.staticMap}
          />
        ) : null}
      </Section>
    </Screen>
  );
}

function LabeledUrl({ label, url }: { label: string; url: string }) {
  return (
    <View style={styles.urlGroup}>
      <Text style={styles.urlLabel}>{label}</Text>
      <Text style={styles.urlText}>{url}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  urlGroup: {
    gap: theme.spacing.xs,
  },
  urlLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  urlText: {
    fontFamily: theme.font.mono,
    fontSize: 12,
    color: theme.colors.primaryDark,
  },
  staticMap: {
    borderRadius: theme.radius.md,
    height: 180,
    width: '100%',
  },
});
