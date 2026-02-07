import 'package:flutter/material.dart';

import 'features/ride/ride_screen.dart';

void main() {
  runApp(const VibingApp());
}

class VibingApp extends StatelessWidget {
  const VibingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Vibing',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      home: const RideScreen(),
    );
  }
}
