
import  { NativeModules, NativeEventEmitter } from 'react-native';
import type { RemoteConfigClientParams, UpdateBehaviour } from './types';

interface RemoteConfigClient {
  createRemoteConfig: (appId: string, updateInterval: number, updateBehaviour: UpdateBehaviour, params?: RemoteConfigClientParams) => void;
  init: () => Promise<boolean>
  getRemoteConfig: () => Promise<string>;
  getString: (key: string) => Promise<string>
  getNumber: (key: string) => Promise<number>
  containsKey: (key: string) => Promise<boolean>
  setLanguage: (language: string) => void
  setAccount: (account: string) => void
}

export default NativeModules.RemoteConfig as RemoteConfigClient;

const remoteConfigEventEmitter = new NativeEventEmitter(NativeModules.RemoteConfig);
export { remoteConfigEventEmitter };

export * from './types';