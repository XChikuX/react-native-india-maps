import { useState } from 'react';
import type {
  Geofence,
  GeofencePage,
  GeofenceStatusResult,
  GeofenceWriteResult,
} from 'react-native-india-maps';
import { useIndiaMaps } from 'react-native-india-maps';

import {
  AppButton,
  ErrorText,
  InfoBox,
  JsonBlock,
  LabeledInput,
  Screen,
  Section,
} from '../components/ui';

/**
 * Geofencing CRUD demo: create, get, list, check status, update and delete a
 * circular fence. Ola Maps only.
 */
export function GeofencingScreen() {
  const client = useIndiaMaps();
  const isOla = client.config.provider !== 'mappls';

  const [projectId, setProjectId] = useState('example-app');
  const [name, setName] = useState('Demo Circle');
  const [latitude, setLatitude] = useState('12.9716');
  const [longitude, setLongitude] = useState('77.5946');
  const [radius, setRadius] = useState('500');

  const [fenceId, setFenceId] = useState<string>();
  const [fence, setFence] = useState<Geofence>();
  const [page, setPage] = useState<GeofencePage>();
  const [status, setStatus] = useState<GeofenceStatusResult>();
  const [writeResult, setWriteResult] = useState<GeofenceWriteResult>();
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

  const center = {
    lat: Number(latitude) || 0,
    lng: Number(longitude) || 0,
  };

  const doCreate = () =>
    run(async () => {
      const result = await client.geofencing.create({
        geometry: {
          type: 'circle',
          center,
          radius: Number(radius) || 500,
        },
        name,
        projectId,
      });
      setWriteResult(result);
      setFenceId(result.fenceId);
    });

  const doGet = () =>
    run(async () => {
      if (!fenceId) {
        throw new Error('Create a geofence first.');
      }
      setFence(await client.geofencing.getById(fenceId));
    });

  const doList = () =>
    run(async () => {
      setPage(await client.geofencing.list(projectId));
    });

  const doCheckStatus = () =>
    run(async () => {
      if (!fenceId) {
        throw new Error('Create a geofence first.');
      }
      setStatus(
        await client.geofencing.checkStatus(fenceId, {
          lat: Number(latitude) || 0,
          lng: Number(longitude) || 0,
        })
      );
    });

  const doUpdate = () =>
    run(async () => {
      if (!fenceId) {
        throw new Error('Create a geofence first.');
      }
      const result = await client.geofencing.update(fenceId, {
        geometry: {
          type: 'circle',
          center,
          radius: Number(radius) || 500,
        },
        name: `${name} (updated)`,
        projectId,
      });
      setWriteResult(result);
    });

  const doDelete = () =>
    run(async () => {
      if (!fenceId) {
        throw new Error('Create a geofence first.');
      }
      await client.geofencing.deleteById(fenceId);
      setWriteResult({
        fenceId,
        message: 'Deleted (call list to confirm).',
      });
      setFenceId(undefined);
      setFence(undefined);
      setStatus(undefined);
    });

  return (
    <Screen>
      {!isOla ? (
        <InfoBox tone="warn">
          Geofencing is part of the Ola Maps API only; Mappls has no public
          geofencing endpoint, so every call throws UNSUPPORTED_ERROR. Switch to
          the Ola provider to try this demo.
        </InfoBox>
      ) : null}

      <Section
        hint="Creates a circular geofence via client.geofencing.create"
        title="Fence definition"
      >
        <LabeledInput
          autoCapitalize="none"
          label="Project ID"
          onChangeText={setProjectId}
          value={projectId}
        />
        <LabeledInput label="Name" onChangeText={setName} value={name} />
        <LabeledInput
          keyboardType="decimal-pad"
          label="Center latitude"
          onChangeText={setLatitude}
          value={latitude}
        />
        <LabeledInput
          keyboardType="decimal-pad"
          label="Center longitude"
          onChangeText={setLongitude}
          value={longitude}
        />
        <LabeledInput
          keyboardType="numeric"
          label="Radius (meters)"
          onChangeText={setRadius}
          value={radius}
        />
        <AppButton
          disabled={!isOla}
          onPress={doCreate}
          title="Create geofence"
        />
        <ErrorText error={error} />
        {fenceId ? (
          <JsonBlock data={{ fenceId, lastWrite: writeResult }} />
        ) : (
          <JsonBlock data={writeResult} />
        )}
      </Section>

      <Section hint="client.geofencing.getById / list" title="Read fences">
        <AppButton
          disabled={!fenceId || !isOla}
          onPress={doGet}
          title="Get by id"
        />
        <JsonBlock data={fence} />
        <AppButton
          disabled={!isOla}
          onPress={doList}
          title="List project fences"
        />
        <JsonBlock data={page} />
      </Section>

      <Section
        hint="Checks the center coordinate against the fence boundary."
        title="Check status"
      >
        <AppButton
          disabled={!fenceId || !isOla}
          onPress={doCheckStatus}
          title="Check status"
        />
        <JsonBlock data={status} />
      </Section>

      <Section
        hint="Renames the fence (full replacement) or deletes it."
        title="Update / delete"
      >
        <AppButton
          disabled={!fenceId || !isOla}
          onPress={doUpdate}
          title="Update name"
        />
        <AppButton
          disabled={!fenceId || !isOla}
          onPress={doDelete}
          title="Delete geofence"
        />
        <JsonBlock data={writeResult} />
      </Section>
    </Screen>
  );
}
