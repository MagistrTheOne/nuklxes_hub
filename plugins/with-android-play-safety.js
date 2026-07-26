const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

/**
 * Hardening for Google Play / Play Protect:
 * - no cleartext HTTP
 * - disable backup of app data
 */
function withAndroidPlaySafety(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      cfg.modResults,
    );

    app.$['android:usesCleartextTraffic'] = 'false';
    app.$['android:allowBackup'] = 'false';

    return cfg;
  });
}

module.exports = withAndroidPlaySafety;
