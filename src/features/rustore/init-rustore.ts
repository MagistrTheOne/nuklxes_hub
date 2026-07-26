import { NativeModules, Platform } from 'react-native';

import Constants from 'expo-constants';

/**
 * RuStore SDKs — Android only, opt-in.
 *
 * - Off by default (Play Store / Play Protect safe).
 * - Enable with EXPO_PUBLIC_RUSTORE_ENABLED=1 for a RuStore-only build.
 * - Never embed RuStore Console API private keys in the client.
 *
 * Compatibility note (Expo 57 / RN 0.86 / New Arch):
 * Official RuStore RN wrappers target older RN (0.72–0.73). Autolinking is
 * disabled unless EXPO_PUBLIC_RUSTORE_ENABLED=1. Even then, native modules are
 * null-checked so a missing/broken module cannot kill the process.
 */
export async function initRustoreSdks(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  if (process.env.EXPO_PUBLIC_RUSTORE_ENABLED !== '1') {
    return;
  }

  try {
    const updateNative = NativeModules.RustoreUpdate as
      | { init?: () => void }
      | undefined;

    if (typeof updateNative?.init === 'function') {
      updateNative.init();
    }
  } catch (error) {
    console.warn('[rustore] Update SDK skipped', error);
  }

  const remoteConfigAppId =
    process.env.EXPO_PUBLIC_RUSTORE_REMOTE_CONFIG_APP_ID?.trim() || '';

  if (!remoteConfigAppId) {
    return;
  }

  try {
    const remoteNative = NativeModules.RemoteConfig as
      | {
          createRemoteConfig?: (
            appId: string,
            interval: number,
            behaviour: string,
            params?: unknown,
          ) => void;
          init?: () => Promise<boolean>;
        }
      | undefined;

    if (typeof remoteNative?.createRemoteConfig !== 'function') {
      return;
    }

    const {
      UpdateBehaviour,
      RemoteConfigClientParams,
      Environment,
    } = require('react-native-rustore-remote-config') as typeof import('react-native-rustore-remote-config');

    const appVersion = Constants.expoConfig?.version ?? '1.0.0';
    const appBuild = String(
      Constants.expoConfig?.android?.versionCode ??
        Constants.nativeBuildVersion ??
        '1',
    );

    remoteNative.createRemoteConfig(
      remoteConfigAppId,
      15,
      UpdateBehaviour.DEFAULT,
      new RemoteConfigClientParams({
        appVersion,
        appBuild,
        environment: Environment.RELEASE,
      }),
    );

    if (typeof remoteNative.init === 'function') {
      await remoteNative.init();
    }
  } catch (error) {
    console.warn('[rustore] Remote Config SDK skipped', error);
  }
}
