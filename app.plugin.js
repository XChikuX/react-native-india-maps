const { createRunOncePlugin } = require('@expo/config-plugins');
const { withIndiaMaps } = require('./plugin/withIndiaMaps');

module.exports = createRunOncePlugin(
  withIndiaMaps,
  'react-native-india-maps',
  '0.5.0'
);
