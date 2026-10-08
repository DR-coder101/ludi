// pnpm + Expo SDK 52 autolinking emits expo.core.ExpoModulesPackage from the
// Android namespace. The class lives in expo.modules.
module.exports = {
  dependencies: {
    expo: {
      platforms: {
        android: {
          packageImportPath: 'import expo.modules.ExpoModulesPackage;',
        },
      },
    },
  },
};
