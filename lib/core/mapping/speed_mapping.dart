class SpeedToVolumeMapping {
  SpeedToVolumeMapping({
    required this.minSpeedMps,
    required this.maxSpeedMps,
    required this.minVolume,
    required this.maxVolume,
  })  : assert(minSpeedMps >= 0),
        assert(maxSpeedMps > minSpeedMps),
        assert(minVolume >= 0 && minVolume <= 1),
        assert(maxVolume >= 0 && maxVolume <= 1),
        assert(maxVolume >= minVolume);

  final double minSpeedMps;
  final double maxSpeedMps;
  final double minVolume;
  final double maxVolume;

  double map(double speedMps) {
    final clampedSpeed = speedMps.clamp(minSpeedMps, maxSpeedMps);
    final t = (clampedSpeed - minSpeedMps) / (maxSpeedMps - minSpeedMps);
    return (minVolume + t * (maxVolume - minVolume)).clamp(0.0, 1.0);
  }
}
