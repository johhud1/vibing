import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';

import { mapSpeedToVolume } from './src/mapping/speedMapping';
import { ExponentialMovingAverage } from './src/smoothing/ema';
import { SystemVolume } from './src/native/SystemVolume';
import {
  ensureLocationPermissions,
  resetSpeedHistory,
  startForegroundWatch,
} from './src/location/speedService';
import {
  RideMode,
  startBackgroundUpdates,
  stopBackgroundUpdates,
  updateRideSettings,
} from './src/location/backgroundTask';

export default function App() {
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<RideMode>('bike');
  const [speedMps, setSpeedMps] = useState(0);
  const [volume, setVolume] = useState(0.2);
  const [minVolume, setMinVolume] = useState(0.2);
  const [maxVolume, setMaxVolume] = useState(0.9);

  const smoothingRef = useRef(new ExponentialMovingAverage(0.25));
  const lastUpdateRef = useRef(0);
  const watchRef = useRef<ReturnType<typeof startForegroundWatch> | null>(null);

  const maxSpeedMps = mode === 'walk' ? 2.5 : 9.0;

  const start = async () => {
    if (running) return;
    await ensureLocationPermissions();
    resetSpeedHistory();
    smoothingRef.current.reset();
    setRunning(true);

    updateRideSettings({ mode, minVolume, maxVolume });
    await startBackgroundUpdates();

    watchRef.current = startForegroundWatch((sample) => {
      const smoothed = smoothingRef.current.update(sample.speedMps);
      setSpeedMps(smoothed);

      const target = mapSpeedToVolume(smoothed, {
        minSpeedMps: 0,
        maxSpeedMps,
        minVolume,
        maxVolume,
      });
      setVolume(target);

      const now = Date.now();
      if (now - lastUpdateRef.current < 500) {
        return;
      }
      lastUpdateRef.current = now;
      SystemVolume.setVolume(target);
    });
  };

  const stop = async () => {
    if (!running) return;
    setRunning(false);
    const watch = await watchRef.current;
    watch?.remove();
    watchRef.current = null;
    await stopBackgroundUpdates();
  };

  const speedMph = speedMps * 2.23694;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vibing</Text>
        <Text style={styles.subtitle}>Speed-based system volume</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.speed}>{speedMph.toFixed(1)} mph</Text>
        <Text style={styles.detail}>Target volume: {(volume * 100).toFixed(0)}%</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mode</Text>
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggle, mode === 'walk' && styles.toggleActive]}
            onPress={() => {
              setMode('walk');
              updateRideSettings({ mode: 'walk' });
            }}
          >
            <Text style={styles.toggleText}>Walk</Text>
          </Pressable>
          <Pressable
            style={[styles.toggle, mode === 'bike' && styles.toggleActive]}
            onPress={() => {
              setMode('bike');
              updateRideSettings({ mode: 'bike' });
            }}
          >
            <Text style={styles.toggleText}>Bike</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Min volume</Text>
        <Slider
          value={minVolume}
          onValueChange={(value) => {
            const clamped = Math.min(value, maxVolume);
            setMinVolume(clamped);
            updateRideSettings({ minVolume: clamped });
          }}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Max volume</Text>
        <Slider
          value={maxVolume}
          onValueChange={(value) => {
            const clamped = Math.max(value, minVolume);
            setMaxVolume(clamped);
            updateRideSettings({ maxVolume: clamped });
          }}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
        />
      </View>

      <View style={styles.section}>
        <Pressable style={styles.primaryButton} onPress={running ? stop : start}>
          <Text style={styles.primaryButtonText}>{running ? 'Stop' : 'Start'}</Text>
        </Pressable>
      </View>

      <Text style={styles.note}>
        {Platform.OS === 'ios'
          ? 'Note: iOS system volume control is best-effort and may not affect other apps in all cases.'
          : 'Note: Android system volume control should affect current media volume.'}
      </Text>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0f172a',
  },
  header: {
    marginTop: 10,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f8fafc',
  },
  subtitle: {
    color: '#94a3b8',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  speed: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  detail: {
    color: '#94a3b8',
    marginTop: 8,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#e2e8f0',
    fontWeight: '600',
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggle: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#1f2937',
  },
  toggleActive: {
    backgroundColor: '#38bdf8',
  },
  toggleText: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#38bdf8',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16,
  },
  note: {
    color: '#94a3b8',
    marginTop: 'auto',
  },
});
