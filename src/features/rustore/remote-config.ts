import { NativeModules, Platform } from 'react-native';

export async function getRustoreConfigString(
  key: string,
): Promise<string | null> {
  if (
    Platform.OS !== 'android' ||
    process.env.EXPO_PUBLIC_RUSTORE_ENABLED !== '1'
  ) {
    return null;
  }

  try {
    const RemoteConfig = NativeModules.RemoteConfig as
      | {
          getString?: (k: string) => Promise<string>;
          containsKey?: (k: string) => Promise<boolean>;
        }
      | undefined;

    if (
      typeof RemoteConfig?.containsKey !== 'function' ||
      typeof RemoteConfig?.getString !== 'function'
    ) {
      return null;
    }

    const exists = await RemoteConfig.containsKey(key);
    if (!exists) {
      return null;
    }

    return RemoteConfig.getString(key);
  } catch {
    return null;
  }
}
