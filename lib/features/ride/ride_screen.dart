import 'package:flutter/material.dart';

import 'ride_controller.dart';

class RideScreen extends StatefulWidget {
  const RideScreen({super.key});

  @override
  State<RideScreen> createState() => _RideScreenState();
}

class _RideScreenState extends State<RideScreen> {
  late final RideController _controller;

  @override
  void initState() {
    super.initState();
    _controller = RideController();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        final speedMph = _controller.speedMps * 2.23694;
        return Scaffold(
          appBar: AppBar(
            title: const Text('Vibing'),
          ),
          body: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _statusCard(speedMph),
                const SizedBox(height: 20),
                _modeToggle(),
                const SizedBox(height: 20),
                _volumeSliders(),
                const Spacer(),
                _primaryButton(),
                const SizedBox(height: 12),
                Text(
                  'Note: iOS system volume control is limited. This app uses best-effort controls and may not adjust other apps in all cases.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _statusCard(double speedMph) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${speedMph.toStringAsFixed(1)} mph',
                  style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                Text('Target volume: ${(_controller.volume * 100).toStringAsFixed(0)}%'),
              ],
            ),
            Icon(
              _controller.running ? Icons.graphic_eq : Icons.pause_circle_filled,
              size: 48,
              color: _controller.running ? Colors.green : Colors.grey,
            ),
          ],
        ),
      ),
    );
  }

  Widget _modeToggle() {
    return Row(
      children: [
        const Text('Mode', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        const SizedBox(width: 16),
        ToggleButtons(
          isSelected: [
            _controller.mode == RideMode.walk,
            _controller.mode == RideMode.bike,
          ],
          onPressed: (index) {
            _controller.setMode(index == 0 ? RideMode.walk : RideMode.bike);
          },
          children: const [
            Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Text('Walk')),
            Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Text('Bike')),
          ],
        ),
      ],
    );
  }

  Widget _volumeSliders() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Min volume'),
        Slider(
          value: _controller.minVolume,
          onChanged: _controller.setMinVolume,
          min: 0,
          max: 1,
        ),
        const SizedBox(height: 8),
        const Text('Max volume'),
        Slider(
          value: _controller.maxVolume,
          onChanged: _controller.setMaxVolume,
          min: 0,
          max: 1,
        ),
      ],
    );
  }

  Widget _primaryButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _controller.running ? _controller.stop : _controller.start,
        style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
        child: Text(_controller.running ? 'Stop' : 'Start'),
      ),
    );
  }
}
