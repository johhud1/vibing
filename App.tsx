import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { mapSpeedToVolume } from './src/mapping/speedMapping';
import { ExponentialMovingAverage } from './src/smoothing/ema';
import {
  ensureLocationPermissions,
  resetSpeedHistory,
  startForegroundWatch,
} from './src/location/speedService';
type RideMode = 'walk' | 'bike';

const audioSource = require('./assets/track.wav');

function AppContent() {
  const insets = useSafeAreaInsets();
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<RideMode>('bike');
  const [speedMps, setSpeedMps] = useState(0);
  const [volume, setVolume] = useState(0.2);
  const [minVolume, setMinVolume] = useState(0.2);
  const [maxVolume, setMaxVolume] = useState(0.9);
  const [showDev, setShowDev] = useState(false);
  const [debug, setDebug] = useState({
    rawSpeedMps: null as number | null,
    latitude: null as number | null,
    longitude: null as number | null,
    accuracy: null as number | null,
    altitude: null as number | null,
    heading: null as number | null,
    timestamp: null as number | null,
  });
  const player = useAudioPlayer(audioSource);

  const smoothingRef = useRef(new ExponentialMovingAverage(0.25));
  const lastUpdateRef = useRef(0);
  const watchRef = useRef<ReturnType<typeof startForegroundWatch> | null>(null);

  const maxSpeedMps = mode === 'walk' ? 2.5 : 9.0;

  useEffect(() => {
    player.loop = true;
    player.volume = minVolume;
  }, [player, minVolume]);

  const start = async () => {
    if (running) return;
    await ensureLocationPermissions();
    resetSpeedHistory();
    smoothingRef.current.reset();
    setRunning(true);

    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    });
    player.play();

    watchRef.current = startForegroundWatch((sample) => {
      const smoothed = smoothingRef.current.update(sample.speedMps);
      setSpeedMps(smoothed);
      setDebug({
        rawSpeedMps: sample.rawSpeedMps,
        latitude: sample.latitude,
        longitude: sample.longitude,
        accuracy: sample.accuracy,
        altitude: sample.altitude,
        heading: sample.heading,
        timestamp: sample.timestamp,
      });

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
      player.volume = target;
    });
  };

  const stop = async () => {
    if (!running) return;
    setRunning(false);
    const watch = await watchRef.current;
    watch?.remove();
    watchRef.current = null;
    player.pause();
    player.seekTo(0);
  };

  const speedMph = speedMps * 2.23694;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Vibing</Text>
        <Text style={styles.subtitle}>Speed-based in-app volume</Text>
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
            }}
          >
            <Text style={styles.toggleText}>Walk</Text>
          </Pressable>
          <Pressable
            style={[styles.toggle, mode === 'bike' && styles.toggleActive]}
            onPress={() => {
              setMode('bike');
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

      <View style={styles.section}>
        <Pressable style={styles.secondaryButton} onPress={() => setShowDev((prev) => !prev)}>
          <Text style={styles.secondaryButtonText}>
            {showDev ? 'Hide developer mode' : 'Show developer mode'}
          </Text>
        </Pressable>
      </View>

      {showDev && (
        <View style={styles.devCard}>
          <Text style={styles.devTitle}>Developer mode</Text>
          <Text style={styles.devLine}>Raw speed: {debug.rawSpeedMps?.toFixed(2) ?? 'n/a'} m/s</Text>
          <Text style={styles.devLine}>
            Lat/Lng: {debug.latitude?.toFixed(5) ?? 'n/a'}, {debug.longitude?.toFixed(5) ?? 'n/a'}
          </Text>
          <Text style={styles.devLine}>Accuracy: {debug.accuracy?.toFixed(1) ?? 'n/a'} m</Text>
          <Text style={styles.devLine}>Altitude: {debug.altitude?.toFixed(1) ?? 'n/a'} m</Text>
          <Text style={styles.devLine}>Heading: {debug.heading?.toFixed(1) ?? 'n/a'}°</Text>
          <Text style={styles.devLine}>
            Timestamp: {debug.timestamp ? new Date(debug.timestamp).toLocaleTimeString() : 'n/a'}
          </Text>
        </View>
      )}

      <Text style={styles.note}>
        Note: This version controls only in-app audio playback, not other apps.
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
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
  secondaryButton: {
    borderColor: '#38bdf8',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  devCard: {
    backgroundColor: '#0b1220',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  devTitle: {
    color: '#e2e8f0',
    fontWeight: '700',
    marginBottom: 8,
  },
  devLine: {
    color: '#cbd5f5',
    marginBottom: 4,
  },
  note: {
    color: '#94a3b8',
    marginTop: 'auto',
  },
});
