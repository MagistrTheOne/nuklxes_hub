/**
 * RuStore native SDKs are incompatible with Expo SDK 57 / RN New Architecture
 * out of the box, and Google Play forbids competing-store in-app updaters.
 *
 * Keep packages in package.json for a future `rustore` flavor, but do NOT
 * autolink them into Play / default Android binaries.
 *
 * Enable only when EXPO_PUBLIC_RUSTORE_ENABLED=1 AND you build a RuStore-only APK.
 */
const rustoreEnabled = process.env.EXPO_PUBLIC_RUSTORE_ENABLED === '1';

module.exports = {
  dependencies: rustoreEnabled
    ? {}
    : {
        'react-native-rustore-update': {
          platforms: { android: null, ios: null },
        },
        'react-native-rustore-remote-config': {
          platforms: { android: null, ios: null },
        },
      },
};
