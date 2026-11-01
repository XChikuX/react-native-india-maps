import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type {
  AddressValidationResult,
  AutocompleteSuggestion,
  GeocodeResult,
  NearbySearchResult,
  PlaceDetails,
  ReverseGeocodeResult,
  TextSearchResult,
} from 'react-native-india-maps';
import { useAutocomplete, useIndiaMaps } from 'react-native-india-maps';

import {
  AppButton,
  ErrorText,
  JsonBlock,
  LabeledInput,
  Screen,
  Section,
} from '../components/ui';
import { theme } from '../theme';

const BENGALURU = '12.9716,77.5946';

/**
 * Places demos: live autocomplete via the `useAutocomplete` hook plus direct
 * client calls for geocoding, reverse geocoding, search and place details.
 */
export function PlacesScreen() {
  const client = useIndiaMaps();
  const {
    results,
    loading,
    error: autocompleteError,
    debouncedSearch,
  } = useAutocomplete({ debounceMs: 300 });

  const [query, setQuery] = useState('koramangala');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>();
  const [geocode, setGeocode] = useState<GeocodeResult[]>();
  const [reverse, setReverse] = useState<ReverseGeocodeResult[]>();
  const [nearby, setNearby] = useState<NearbySearchResult[]>();
  const [textSearch, setTextSearch] = useState<TextSearchResult[]>();
  const [details, setDetails] = useState<PlaceDetails>();
  const [validation, setValidation] = useState<AddressValidationResult>();
  const [error, setError] = useState<Error>();

  const isOla = client.config.provider !== 'mappls';

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

  const searchAutocomplete = () => debouncedSearch(query);

  const doGeocode = () =>
    run(async () => {
      setGeocode(await client.places.geocode(query));
    });

  const doReverse = () =>
    run(async () => {
      setReverse(await client.places.reverseGeocode(BENGALURU));
    });

  const doNearby = () =>
    run(async () => {
      setNearby(
        await client.places.nearbySearch(BENGALURU, {
          radius: 2000,
          types: 'restaurant',
        })
      );
    });

  const doTextSearch = () =>
    run(async () => {
      setTextSearch(await client.places.textSearch(query));
    });

  const doDetails = () =>
    run(async () => {
      const placeId = selectedPlaceId ?? results[0]?.placeId;
      if (!placeId) {
        throw new Error('Search for a place first, then tap a suggestion.');
      }
      setDetails(await client.places.placeDetails(placeId));
    });

  const doValidation = () =>
    run(async () => {
      setValidation(await client.places.addressValidation(query));
    });

  return (
    <Screen>
      <Section
        hint="Debounced via the useAutocomplete hook (300 ms). Tap a suggestion to select its place for the details call."
        title="Autocomplete (hook)"
      >
        <LabeledInput
          label="Query"
          onChangeText={(value) => {
            setQuery(value);
            debouncedSearch(value);
          }}
          value={query}
        />
        <AppButton
          onPress={searchAutocomplete}
          title={loading ? 'Searching…' : 'Run autocomplete'}
        />
        <ErrorText error={autocompleteError} />
        <View style={styles.suggestionList}>
          {results.map((suggestion: AutocompleteSuggestion) => (
            <SuggestionRow
              isSelected={suggestion.placeId === selectedPlaceId}
              key={`${suggestion.placeId}-${suggestion.name}`}
              onSelect={() => setSelectedPlaceId(suggestion.placeId)}
              suggestion={suggestion}
            />
          ))}
          {results.length === 0 ? (
            <Text style={styles.emptyText}>No suggestions yet.</Text>
          ) : null}
        </View>
      </Section>

      <Section hint="Direct client call: client.places.geocode" title="Geocode">
        <AppButton onPress={doGeocode} title="Geocode query" />
        <ErrorText error={error} />
        <JsonBlock data={geocode} />
      </Section>

      <Section hint={`Reverse geocodes ${BENGALURU}`} title="Reverse geocode">
        <AppButton onPress={doReverse} title="Reverse geocode" />
        <JsonBlock data={reverse} />
      </Section>

      <Section
        hint="Restaurants within 2 km of Bengaluru center"
        title="Nearby search"
      >
        <AppButton onPress={doNearby} title="Search nearby" />
        <JsonBlock data={nearby} />
      </Section>

      <Section
        hint="Direct client call: client.places.textSearch"
        title="Text search"
      >
        <AppButton onPress={doTextSearch} title="Text search" />
        <JsonBlock data={textSearch} />
      </Section>

      <Section
        hint="Uses the selected suggestion's placeId (Ola place_id / Mappls eLoc)."
        title="Place details"
      >
        <AppButton onPress={doDetails} title="Get place details" />
        <JsonBlock data={details} />
      </Section>

      {isOla ? (
        <Section hint="Ola Maps only" title="Address validation">
          <AppButton onPress={doValidation} title="Validate address" />
          <JsonBlock data={validation} />
        </Section>
      ) : null}
    </Screen>
  );
}

function SuggestionRow({
  suggestion,
  isSelected,
  onSelect,
}: {
  suggestion: AutocompleteSuggestion;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={[styles.suggestionRow, isSelected && styles.suggestionRowSelected]}
    >
      <Text style={styles.suggestionName}>{suggestion.name}</Text>
      {suggestion.address ? (
        <Text style={styles.suggestionAddress}>{suggestion.address}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  suggestionList: {
    gap: theme.spacing.xs,
  },
  suggestionRow: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  suggestionRowSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  suggestionAddress: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
});
