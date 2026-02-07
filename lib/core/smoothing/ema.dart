class ExponentialMovingAverage {
  ExponentialMovingAverage({required this.alpha})
      : assert(alpha > 0 && alpha <= 1);

  final double alpha;
  double? _value;

  double update(double input) {
    if (_value == null) {
      _value = input;
    } else {
      _value = alpha * input + (1 - alpha) * _value!;
    }
    return _value!;
  }

  double get value => _value ?? 0;

  void reset([double? value]) {
    _value = value;
  }
}
