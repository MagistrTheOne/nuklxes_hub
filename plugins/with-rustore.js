const {
  withAndroidManifest,
  withProjectBuildGradle,
  AndroidConfig,
} = require('@expo/config-plugins');

const RUSTORE_MAVEN =
  'https://artifactory-external.vkpartner.ru/artifactory/maven';

/**
 * RuStore native SDKs need VK Partner Maven + console app id meta-data.
 * Private RuStore API keys must NEVER be placed in the Android app — server only.
 */
function withRustoreMaven(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      return cfg;
    }

    const mavenBlock = `maven { url '${RUSTORE_MAVEN}' }`;
    if (!cfg.modResults.contents.includes(RUSTORE_MAVEN)) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /repositories\s*\{/,
        `repositories {\n        ${mavenBlock}`,
      );
    }

    return cfg;
  });
}

function withRustoreManifest(config, { consoleAppId }) {
  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      cfg.modResults,
    );

    if (!app['meta-data']) {
      app['meta-data'] = [];
    }

    const metas = app['meta-data'];
    const upsert = (name, value) => {
      const existing = metas.find((item) => item.$?.['android:name'] === name);
      if (existing) {
        existing.$['android:value'] = value;
        return;
      }
      metas.push({
        $: {
          'android:name': name,
          'android:value': value,
        },
      });
    };

    if (consoleAppId) {
      upsert('console_app_id_value', String(consoleAppId));
    }

    // Pay SDK deeplink scheme (safe even if Pay SDK not yet linked)
    upsert('sdk_pay_scheme_value', 'nullxeshub');

    return cfg;
  });
}

function withRustore(config, props = {}) {
  const consoleAppId =
    props.consoleAppId ||
    process.env.EXPO_PUBLIC_RUSTORE_CONSOLE_APP_ID ||
    '';

  config = withRustoreMaven(config);
  config = withRustoreManifest(config, { consoleAppId });
  return config;
}

module.exports = withRustore;
