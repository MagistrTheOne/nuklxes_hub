declare module 'react-native-rustore-update' {
  export enum ResultCode {
    RESULT_OK = -1,
    RESULT_CANCELED = 0,
    ACTIVITY_NOT_FOUND = 2,
  }

  export enum UpdateAvailability {
    UNKNOWN = 0,
    UPDATE_NOT_AVAILABLE = 1,
    UPDATE_AVAILABLE = 2,
    DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS = 3,
  }

  export interface AppUpdateInfo {
    updatedAt: string;
    packageName: string;
    updatePriority: number;
    updateAvailability: UpdateAvailability;
    availableVersionCode: number;
    installStatus: number;
  }

  const RustoreUpdate: {
    init: () => void;
    getAppUpdateInfo: () => Promise<AppUpdateInfo>;
    download: () => Promise<ResultCode>;
    immediate: () => Promise<ResultCode>;
    silent: () => Promise<ResultCode>;
    completeUpdate: (type: number) => Promise<boolean>;
  };

  export default RustoreUpdate;
}

declare module 'react-native-rustore-remote-config' {
  export enum UpdateBehaviour {
    ACTUAL = 'ACTUAL',
    DEFAULT = 'DEFAULT',
    SNAPSHOT = 'SNAPSHOT',
  }

  export enum Environment {
    ALPHA = 'ALPHA',
    BETA = 'BETA',
    RELEASE = 'RELEASE',
  }

  export class RemoteConfigClientParams {
    constructor(params: {
      deviceModel?: string;
      osVersion?: string;
      deviceId?: string;
      appVersion?: string;
      appBuild?: string;
      environment?: Environment;
    });
  }

  const RemoteConfig: {
    createRemoteConfig: (
      appId: string,
      updateInterval: number,
      updateBehaviour: UpdateBehaviour,
      params?: RemoteConfigClientParams,
    ) => void;
    init: () => Promise<boolean>;
    getRemoteConfig: () => Promise<string>;
    getString: (key: string) => Promise<string>;
    getNumber: (key: string) => Promise<number>;
    containsKey: (key: string) => Promise<boolean>;
    setLanguage: (language: string) => void;
    setAccount: (account: string) => void;
  };

  export default RemoteConfig;
}
