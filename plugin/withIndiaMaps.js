const {
  AndroidConfig,
  withAndroidManifest,
  withInfoPlist,
} = require('./loadConfigPlugins');

const DEFAULT_IOS_MESSAGE =
  'Allow $(PRODUCT_NAME) to access your location while using the app.';

const withLocationPermissions = (config, options) => {
  config = withAndroidManifest(config, (modConfig) => {
    const permissions = [
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
    ];

    if (options.backgroundLocation) {
      permissions.push('android.permission.ACCESS_BACKGROUND_LOCATION');
    }

    permissions.forEach((permission) => {
      AndroidConfig.Permissions.ensurePermission(
        modConfig.modResults,
        permission
      );
    });

    return modConfig;
  });

  config = withInfoPlist(config, (modConfig) => {
    modConfig.modResults.NSLocationWhenInUseUsageDescription =
      options.iosWhenInUsePermission || DEFAULT_IOS_MESSAGE;

    if (options.backgroundLocation) {
      modConfig.modResults.NSLocationAlwaysAndWhenInUseUsageDescription =
        options.iosAlwaysAndWhenInUseUsageDescription || DEFAULT_IOS_MESSAGE;
    }

    return modConfig;
  });

  return config;
};

const withIndiaMaps = (config, props = {}) => {
  const options = {
    backgroundLocation: false,
    iosWhenInUsePermission: DEFAULT_IOS_MESSAGE,
    iosAlwaysAndWhenInUseUsageDescription: DEFAULT_IOS_MESSAGE,
    ...props,
  };

  config = withLocationPermissions(config, options);
  return config;
};

module.exports = { withIndiaMaps };
