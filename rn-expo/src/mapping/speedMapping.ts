export type SpeedToVolumeConfig = {
  minSpeedMps: number;
  maxSpeedMps: number;
  minVolume: number;
  maxVolume: number;
};

export function mapSpeedToVolume(speedMps: number, config: SpeedToVolumeConfig): number {
  const { minSpeedMps, maxSpeedMps, minVolume, maxVolume } = config;
  const clampedSpeed = Math.min(Math.max(speedMps, minSpeedMps), maxSpeedMps);
  const t = (clampedSpeed - minSpeedMps) / (maxSpeedMps - minSpeedMps);
  const volume = minVolume + t * (maxVolume - minVolume);
  return Math.min(Math.max(volume, 0), 1);
}
