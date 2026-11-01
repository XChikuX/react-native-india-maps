import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import {
  Callout,
  MapView,
  Marker,
  Polygon,
  Polyline,
  UserLocation,
  useIndiaMaps,
  MAP_STYLES,
} from 'react-native-india-maps';

import { InfoBox, Section } from '../components/ui';
import { theme } from '../theme';

const STYLE_OPTIONS = [
  MAP_STYLES.lightStandard,
  MAP_STYLES.darkStandard,
  MAP_STYLES.eclipseDark,
  MAP_STYLES.vintageLight,
] as const;

const BENGALURU = { latitude: 12.9716, longitude: 77.5946 };

/** Marker + polygon + polyline demo overlays around Bengaluru. */
export function MapScreen() {
  const client = useIndiaMaps();
  const [styleName, setStyleName] = useState<string>(MAP_STYLES.lightStandard);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const isMappls = client.config.provider === 'mappls';

  return (
    <View style={styles.container}>
      <MapView
        initialRegion={{ ...BENGALURU, zoomLevel: 11 }}
        onMapReady={() => setMapReady(true)}
        style={styles.map}
        styleName={styleName}
      >
        {showUserLocation ? <UserLocation /> : null}

        <Marker
          coordinate={{ latitude: 12.9756, longitude: 77.5993 }}
          id="cubbon-park"
        >
          <Callout title="Cubbon Park">
            <Text style={styles.calloutSubtitle}>A landmark in Bengaluru</Text>
          </Callout>
        </Marker>

        <Polygon
          coordinates={[
            { latitude: 12.9698, longitude: 77.587 },
            { latitude: 12.9754, longitude: 77.592 },
            { latitude: 12.9722, longitude: 77.6002 },
            { latitude: 12.9668, longitude: 77.595 },
          ]}
          fillColor="#2563eb"
          fillOpacity={0.2}
          id="demo-polygon"
          strokeColor="#1e40af"
          strokeWidth={2}
        />

        <Polyline
          color="#dc2626"
          coordinates={[
            { latitude: 12.9611, longitude: 77.6387 }, // Koramangala
            { latitude: 12.9719, longitude: 77.5946 }, // MG Road area
            { latitude: 12.9899, longitude: 77.5954 }, // Jayamahal
          ]}
          id="demo-polyline"
          width={4}
        />
      </MapView>

      <View style={styles.controls}>
        {isMappls ? (
          <InfoBox tone="warn">
            Mappls exposes no public vector tile styles, so the canvas stays
            empty. Marker, polygon and polyline overlays still render. Switch to
            the Ola provider to see styled tiles.
          </InfoBox>
        ) : (
          <InfoBox>
            {mapReady ? 'Map is ready.' : 'Loading map…'} Tap a marker to open
            its callout.
          </InfoBox>
        )}

        <Section title="Map style">
          <View style={styles.styleRow}>
            {STYLE_OPTIONS.map((option) => (
              <Text
                key={option}
                onPress={() => setStyleName(option)}
                style={[
                  styles.styleChip,
                  styleName === option && styles.styleChipActive,
                ]}
              >
                {option}
              </Text>
            ))}
          </View>
        </Section>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Show user location</Text>
          <Switch
            onValueChange={setShowUserLocation}
            value={showUserLocation}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controls: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  styleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  styleChip: {
    backgroundColor: theme.colors.chipBg,
    color: theme.colors.text,
    borderRadius: 999,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  styleChipActive: {
    backgroundColor: theme.colors.chipSelected,
    color: theme.colors.chipSelectedText,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  switchLabel: {
    fontSize: 14,
    color: theme.colors.text,
  },
  calloutSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
});
