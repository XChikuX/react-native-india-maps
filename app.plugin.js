const { createRunOncePlugin } = require('./plugin/loadConfigPlugins');
const { withIndiaMaps } = require('./plugin/withIndiaMaps');
const packageJson = require('./package.json');

module.exports = createRunOncePlugin(
  withIndiaMaps,
  packageJson.name,
  packageJson.version
);
