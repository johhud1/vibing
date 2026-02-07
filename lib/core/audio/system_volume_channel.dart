import 'package:flutter/services.dart';

class SystemVolumeChannel {
  static const MethodChannel _channel = MethodChannel('com.vibing/system_volume');

  static Future<void> setVolume(double volume) async {
    final clamped = volume.clamp(0.0, 1.0);
    await _channel.invokeMethod<void>('setVolume', {
      'volume': clamped,
    });
  }
}
