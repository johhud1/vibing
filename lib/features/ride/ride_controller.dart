import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../core/audio/system_volume_channel.dart';
import '../../core/location/speed_service.dart';
import '../../core/mapping/speed_mapping.dart';
import '../../core/smoothing/ema.dart';

enum RideMode {
  walk,
  bike,
}

class RideController extends ChangeNotifier {
  RideController({
    SpeedService? speedService,
  }) : _speedService = speedService ?? SpeedService();

  final SpeedService _speedService;
  StreamSubscription<double>? _speedSub;
  final ExponentialMovingAverage _smoothing = ExponentialMovingAverage(alpha: 0.25);
  DateTime _lastVolumeUpdate = DateTime.fromMillisecondsSinceEpoch(0);

  bool _running = false;
  RideMode _mode = RideMode.bike;
  double _speedMps = 0;
  double _volume = 0.2;
  double _minVolume = 0.2;
  double _maxVolume = 0.9;

  bool get running => _running;
  RideMode get mode => _mode;
  double get speedMps => _speedMps;
  double get volume => _volume;
  double get minVolume => _minVolume;
  double get maxVolume => _maxVolume;

  SpeedToVolumeMapping get _mapping {
    final maxSpeed = _mode == RideMode.walk ? 2.5 : 9.0; // m/s
    return SpeedToVolumeMapping(
      minSpeedMps: 0,
      maxSpeedMps: maxSpeed,
      minVolume: _minVolume,
      maxVolume: _maxVolume,
    );
  }

  Future<void> start() async {
    if (_running) return;
    await _speedService.ensurePermissions();
    _running = true;
    _smoothing.reset();
    notifyListeners();

    _speedSub = _speedService.speedStream().listen(
      (speed) => _handleSpeed(speed),
      onError: (error) {
        _running = false;
        notifyListeners();
      },
    );
  }

  Future<void> stop() async {
    if (!_running) return;
    _running = false;
    await _speedSub?.cancel();
    _speedSub = null;
    notifyListeners();
  }

  void setMode(RideMode mode) {
    if (_mode == mode) return;
    _mode = mode;
    notifyListeners();
  }

  void setMinVolume(double value) {
    _minVolume = value.clamp(0.0, _maxVolume);
    notifyListeners();
  }

  void setMaxVolume(double value) {
    _maxVolume = value.clamp(_minVolume, 1.0);
    notifyListeners();
  }

  Future<void> _handleSpeed(double speed) async {
    final smoothed = _smoothing.update(speed);
    _speedMps = smoothed;

    final targetVolume = _mapping.map(smoothed);
    _volume = targetVolume;
    notifyListeners();

    final now = DateTime.now();
    if (now.difference(_lastVolumeUpdate).inMilliseconds < 500) {
      return;
    }
    _lastVolumeUpdate = now;

    try {
      await SystemVolumeChannel.setVolume(targetVolume);
    } catch (_) {
      // Ignore platform failures for now; UI still updates.
    }
  }
}
