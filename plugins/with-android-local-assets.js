const { withAppBuildGradle } = require('@expo/config-plugins');

const MARKER = 'android-local-assets';
const INSERT = `    sourceSets {
        main {
            assets.srcDirs += ['../../android-local-assets']
        }
    }
`;

module.exports = function withAndroidLocalAssets(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes(MARKER)) {
      return config;
    }
    config.modResults.contents = config.modResults.contents.replace(
      /(\s*androidResources\s*\{[^}]*\}\s*\})/,
      (match) => match + '\n' + INSERT,
    );
    return config;
  });
};
