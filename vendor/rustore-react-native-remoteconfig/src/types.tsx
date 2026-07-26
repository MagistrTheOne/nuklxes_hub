export enum UpdateBehaviour {
    ACTUAL = 'ACTUAL',
    DEFAULT = 'DEFAULT',
    SNAPSHOT = 'SNAPSHOT',
  }

  export enum Environment {
    ALPHA = 'ALPHA',
    BETA = 'BETA',
    RELEASE = 'RELEASE'
  }

  export enum RemoteConfigEvents {
    BACKGROUND_JOB_ERRORS = "BACKGROUND_JOB_ERRORS",
    FIRST_LOAD_COMPLETE = "FIRST_LOAD_COMPLETE",
    INIT_COMPLETE = "INIT_COMPLETE",
    MEMORY_CACHE_UPDATED = "MEMORY_CACHE_UPDATED",
    PERSISTENT_STORAGE_UPDATED = "PERSISTENT_STORAGE_UPDATED",
    REMOTE_CONFIG_NETWORK_REQUEST_FAILURE = "REMOTE_CONFIG_NETWORK_REQUEST_FAILURE"
  }

  export class RemoteConfigClientParams {
    deviceModel?: string ;
    osVersion?: string;
    deviceId?: string;
    appVersion?: string;
    appBuild?: string;
    environment?: Environment;
    constructor(params: {deviceModel?: string, osVersion?: string, deviceId?: string, appVersion?: string, appBuild?: string, environment?: Environment}) {
        this.deviceModel = params.deviceModel;
        this.osVersion = params.osVersion;
        this.deviceId = params.deviceId;
        this.appVersion = params.appVersion;
        this.appBuild = params.appBuild;
        this.environment = params.environment;
      }
  }