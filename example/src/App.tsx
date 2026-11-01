import { useMemo, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  IndiaMapsClient,
  IndiaMapsProvider,
  type MapProvider,
} from 'react-native-india-maps';

import { Chips, InfoBox } from './components/ui';
import { GeofencingScreen } from './screens/GeofencingScreen';
import { MapScreen } from './screens/MapScreen';
import { PlacesScreen } from './screens/PlacesScreen';
import { RoutingScreen } from './screens/RoutingScreen';
import { UtilitiesScreen } from './screens/UtilitiesScreen';
import { theme } from './theme';

const TABS = ['map', 'places', 'routing', 'geofencing', 'utilities'] as const;
type Tab = (typeof TABS)[number];

const olaKey = process.env.EXPO_PUBLIC_OLA_MAPS_API_KEY;
const mapplsToken = process.env.EXPO_PUBLIC_MAPPLS_ACCESS_TOKEN;

const defaultProvider: MapProvider = !olaKey && mapplsToken ? 'mappls' : 'ola';

/** Credential for the active provider, if configured. */
function credentialFor(provider: MapProvider): string | undefined {
  return provider === 'mappls' ? mapplsToken : olaKey;
}

export default function App() {
  const [provider, setProvider] = useState<MapProvider>(defaultProvider);
  const [tab, setTab] = useState<Tab>('map');

  const credential = credentialFor(provider);
  const client = useMemo(
    () =>
      new IndiaMapsClient({
        apiKey: provider === 'ola' ? credential : undefined,
        accessToken: provider === 'mappls' ? credential : undefined,
        provider,
      }),
    [credential, provider]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>India Maps Example</Text>
          <Text style={styles.subtitle}>
            react-native-india-maps · provider: {provider}
          </Text>
        </View>
      </View>

      <Chips
        onChange={(value) => setProvider(value)}
        options={['ola', 'mappls'] as const satisfies readonly MapProvider[]}
        value={provider}
      />

      {!credential ? (
        <InfoBox tone="warn">
          No {provider === 'ola' ? 'Ola Maps API key' : 'Mappls access token'}{' '}
          found — every API call will fail with a CONFIGURATION_ERROR. Set{' '}
          {provider === 'ola'
            ? 'EXPO_PUBLIC_OLA_MAPS_API_KEY'
            : 'EXPO_PUBLIC_MAPPLS_ACCESS_TOKEN'}{' '}
          in example/.env.local and restart the dev server. See
          example/README.md.
        </InfoBox>
      ) : null}

      <IndiaMapsProvider client={client}>
        {/* Remount the active screen when the provider changes so demo state
            does not leak between providers. */}
        <View key={`${provider}-${tab}`} style={styles.body}>
          {tab === 'map' ? <MapScreen /> : null}
          {tab === 'places' ? <PlacesScreen /> : null}
          {tab === 'routing' ? <RoutingScreen /> : null}
          {tab === 'geofencing' ? <GeofencingScreen /> : null}
          {tab === 'utilities' ? <UtilitiesScreen /> : null}
        </View>
      </IndiaMapsProvider>

      <View style={styles.tabBar}>
        {TABS.map((entry) => (
          <Text
            key={entry}
            onPress={() => setTab(entry)}
            style={[styles.tabItem, tab === entry && styles.tabItemActive]}
          >
            {entry}
          </Text>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    paddingBottom: Platform.OS === 'android' ? 0 : theme.spacing.sm,
  },
  tabItem: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    paddingVertical: theme.spacing.md,
    textTransform: 'capitalize',
  },
  tabItemActive: {
    color: theme.colors.primary,
  },
});
