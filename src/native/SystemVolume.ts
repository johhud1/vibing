import { NativeModules } from 'react-native';

type SystemVolumeModule = {
  setVolume: (volume: number) => void | Promise<void>;
};

const nativeModule = NativeModules.SystemVolume as SystemVolumeModule | undefined;

export const SystemVolume = {
  async setVolume(volume: number) {
    if (!nativeModule?.setVolume) return;
    const clamped = Math.min(Math.max(volume, 0), 1);
    await Promise.resolve(nativeModule.setVolume(clamped));
  },
};
