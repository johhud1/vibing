import 'dart:async';

import 'package:geolocator/geolocator.dart';

class SpeedService {
  Stream<double>? _stream;

  Future<void> ensurePermissions() async {
    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) {
      throw StateError('Location services are disabled.');
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied) {
      throw StateError('Location permission denied.');
    }
    if (permission == LocationPermission.deniedForever) {
      throw StateError('Location permission permanently denied.');
    }
  }

  Stream<double> speedStream({
    LocationAccuracy accuracy = LocationAccuracy.bestForNavigation,
    int distanceFilterMeters = 3,
  }) {
    _stream ??= Geolocator.getPositionStream(
      locationSettings: LocationSettings(
        accuracy: accuracy,
        distanceFilter: distanceFilterMeters,
      ),
    ).transform(_SpeedTransformer());

    return _stream!;
  }
}

class _SpeedTransformer extends StreamTransformerBase<Position, double> {
  Position? _last;

  @override
  Stream<double> bind(Stream<Position> stream) {
    return stream.map((position) {
      final rawSpeed = position.speed;
      if (rawSpeed > 0) {
        _last = position;
        return rawSpeed;
      }

      if (_last == null) {
        _last = position;
        return 0;
      }

      final timeDelta = position.timestamp?.difference(_last!.timestamp ?? position.timestamp!) ?? Duration.zero;
      final seconds = timeDelta.inMilliseconds / 1000.0;
      if (seconds <= 0) {
        _last = position;
        return 0;
      }

      final distance = Geolocator.distanceBetween(
        _last!.latitude,
        _last!.longitude,
        position.latitude,
        position.longitude,
      );

      _last = position;
      return distance / seconds;
    });
  }
}
