import { NativeModules, Platform } from 'react-native';

export type RustoreUpdateAvailability =
  | 'unknown'
  | 'not_available'
  | 'available'
  | 'in_progress';

/**
 * RuStore in-app updates must NOT ship in Google Play builds
 * (Play policy: updates only via Play). Used only when
 * EXPO_PUBLIC_RUSTORE_ENABLED=1 for RuStore channel APKs.
 */
export async function checkRustoreUpdate(): Promise<{
  availability: RustoreUpdateAvailability;
  availableVersionCode?: number;
} | null> {
  if (
    Platform.OS !== 'android' ||
    process.env.EXPO_PUBLIC_RUSTORE_ENABLED !== '1'
  ) {
    return null;
  }

  try {
    const Update = NativeModules.RustoreUpdate as
      | { getAppUpdateInfo?: () => Promise<{ updateAvailability: number; availableVersionCode: number }> }
      | undefined;

    if (typeof Update?.getAppUpdateInfo !== 'function') {
      return null;
    }

    const info = await Update.getAppUpdateInfo();
    const map: Record<number, RustoreUpdateAvailability> = {
      0: 'unknown',
      1: 'not_available',
      2: 'available',
      3: 'in_progress',
    };

    return {
      availability: map[info.updateAvailability] ?? 'unknown',
      availableVersionCode: info.availableVersionCode,
    };
  } catch {
    return null;
  }
}

export async function promptRustoreUpdateDownload(): Promise<boolean> {
  if (
    Platform.OS !== 'android' ||
    process.env.EXPO_PUBLIC_RUSTORE_ENABLED !== '1'
  ) {
    return false;
  }

  try {
    const Update = NativeModules.RustoreUpdate as
      | { download?: () => Promise<number> }
      | undefined;

    if (typeof Update?.download !== 'function') {
      return false;
    }

    // ResultCode.RESULT_OK = -1
    return (await Update.download()) === -1;
  } catch {
    return false;
  }
}
