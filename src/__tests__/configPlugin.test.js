const { withIndiaMaps } = require('../../plugin/withIndiaMaps');
const appPlugin = require('../../app.plugin');

const runAndroidManifestMod = async (config, manifest) =>
  config.mods.android.manifest({ modRequest: {}, modResults: manifest });

const runInfoPlistMod = async (config, infoPlist) =>
  config.mods.ios.infoPlist({ modRequest: {}, modResults: infoPlist });

describe('Expo config plugin', () => {
  it('adds foreground location permissions on Android', async () => {
    const config = withIndiaMaps({});
    const result = await runAndroidManifestMod(config, { manifest: {} });

    expect(
      result.modResults.manifest['uses-permission'].map(
        (permission) => permission.$['android:name']
      )
    ).toEqual([
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
    ]);
  });

  it('adds background location permission only when requested', async () => {
    const config = withIndiaMaps({}, { backgroundLocation: true });
    const result = await runAndroidManifestMod(config, { manifest: {} });

    expect(
      result.modResults.manifest['uses-permission'].map(
        (permission) => permission.$['android:name']
      )
    ).toEqual([
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_BACKGROUND_LOCATION',
    ]);
  });

  it('does not duplicate permissions already in the Android manifest', async () => {
    const existingPermissions = [
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
    ].map((name) => ({ $: { 'android:name': name } }));
    const config = withIndiaMaps({});
    const result = await runAndroidManifestMod(config, {
      manifest: { 'uses-permission': existingPermissions },
    });

    expect(result.modResults.manifest['uses-permission']).toHaveLength(2);
  });

  it('sets the iOS foreground usage description without enabling background location', async () => {
    const config = withIndiaMaps({});
    const result = await runInfoPlistMod(config, {});

    expect(result.modResults.NSLocationWhenInUseUsageDescription).toBe(
      'Allow $(PRODUCT_NAME) to access your location while using the app.'
    );
    expect(
      result.modResults.NSLocationAlwaysAndWhenInUseUsageDescription
    ).toBeUndefined();
  });

  it('sets both customized iOS usage descriptions when background location is enabled', async () => {
    const config = withIndiaMaps(
      {},
      {
        backgroundLocation: true,
        iosWhenInUsePermission: 'Use location while the app is open.',
        iosAlwaysAndWhenInUseUsageDescription:
          'Use location to track an active trip.',
      }
    );
    const result = await runInfoPlistMod(config, {});

    expect(result.modResults.NSLocationWhenInUseUsageDescription).toBe(
      'Use location while the app is open.'
    );
    expect(result.modResults.NSLocationAlwaysAndWhenInUseUsageDescription).toBe(
      'Use location to track an active trip.'
    );
  });

  it('runs only once for a given Expo config', () => {
    const config = {};
    const firstResult = appPlugin(config);

    expect(appPlugin(firstResult)).toBe(firstResult);
  });
});
