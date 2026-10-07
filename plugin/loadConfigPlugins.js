const isUnavailableModule = (error, request) => {
  if (error.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
    return true;
  }

  return (
    error.code === 'MODULE_NOT_FOUND' && error.message.includes(`'${request}'`)
  );
};

let configPlugins;

try {
  configPlugins = require('expo/config-plugins');
} catch (expoError) {
  if (!isUnavailableModule(expoError, 'expo/config-plugins')) {
    throw expoError;
  }

  try {
    configPlugins = require('@expo/config-plugins');
  } catch (configPluginsError) {
    if (!isUnavailableModule(configPluginsError, '@expo/config-plugins')) {
      throw configPluginsError;
    }

    throw new Error(
      'The react-native-india-maps config plugin requires Expo SDK 55+ or @expo/config-plugins.'
    );
  }
}

module.exports = configPlugins;
