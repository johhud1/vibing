import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';

// Try to import volume manager (requires dev build)
let VolumeManager: any = null;
try {
  VolumeManager = require('react-native-volume-manager').VolumeManager;
} catch (e) {
  // Not available in Expo Go
}

// Default 8-level speed thresholds in mph (volume maxes at 12mph)
const DEFAULT_THRESHOLDS = [
  { speed: 0, volume: 0.05, label: 'Stopped' },
  { speed: 2, volume: 0.20, label: 'Crawling' },
  { speed: 4, volume: 0.35, label: 'Walking' },
  { speed: 6, volume: 0.50, label: 'Jogging' },
  { speed: 8, volume: 0.65, label: 'Easy pedal' },
  { speed: 10, volume: 0.80, label: 'Cruising' },
  { speed: 12, volume: 1.00, label: 'Fast' },
  { speed: 15, volume: 1.00, label: 'Flying' },
];

// Convert m/s to mph
const msToMph = (ms: number) => ms * 2.237;

// GPS accuracy descriptions
const getAccuracyLabel = (accuracy: number | null): { label: string; color: string } => {
  if (accuracy === null) return { label: 'Unknown', color: '#888' };
  if (accuracy <= 5) return { label: 'Excellent', color: '#00ff88' };
  if (accuracy <= 10) return { label: 'Good', color: '#7bed9f' };
  if (accuracy <= 20) return { label: 'Fair', color: '#ffa502' };
  if (accuracy <= 50) return { label: 'Poor', color: '#ff6348' };
  return { label: 'Very Poor', color: '#ff4757' };
};

export default function App() {
  const [isTracking, setIsTracking] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [targetVolume, setTargetVolume] = useState(1);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [lastVolumeLevel, setLastVolumeLevel] = useState<number>(7);

  // Dev mode
  const [devMode, setDevMode] = useState(false);
  const [manualSpeed, setManualSpeed] = useState(0);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  // Calculate volume and level index based on speed
  const getVolumeForSpeed = useCallback((speedMph: number): { volume: number; levelIndex: number } => {
    let levelIndex = 0;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (speedMph >= thresholds[i].speed) {
        levelIndex = i;
        break;
      }
    }
    return { volume: thresholds[levelIndex].volume, levelIndex };
  }, [thresholds]);

  // Get current speed label
  const getCurrentLabel = useCallback(() => {
    const currentSpeed = devMode ? manualSpeed : speed;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (currentSpeed >= thresholds[i].speed) {
        return thresholds[i].label;
      }
    }
    return thresholds[0].label;
  }, [devMode, manualSpeed, speed, thresholds]);

  // Handle speed updates (from GPS or manual)
  const updateVolumeForSpeed = useCallback((currentSpeed: number) => {
    const { volume, levelIndex } = getVolumeForSpeed(currentSpeed);
    setTargetVolume(volume);

    // Actually set system volume if native module is available
    if (VolumeManager) {
      try {
        VolumeManager.setVolume(volume, { showUI: false });
      } catch (e) {
        // Silently fail if volume control not available
      }
    }

    setLastVolumeLevel(levelIndex);
  }, [getVolumeForSpeed, lastVolumeLevel, thresholds.length]);

  // Handle GPS location update
  const handleLocationUpdate = useCallback((location: Location.LocationObject) => {
    const speedMs = location.coords.speed ?? 0;
    const speedMph = Math.max(0, msToMph(speedMs));
    setSpeed(speedMph);
    setGpsAccuracy(location.coords.accuracy);

    if (!devMode) {
      updateVolumeForSpeed(speedMph);
    }
  }, [devMode, updateVolumeForSpeed]);

  // Handle manual speed changes in dev mode
  useEffect(() => {
    if (devMode) {
      updateVolumeForSpeed(manualSpeed);
    }
  }, [devMode, manualSpeed, updateVolumeForSpeed]);

  // Start tracking
  const startTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for speed tracking.');
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        handleLocationUpdate
      );

      setLocationSubscription(subscription);
      setIsTracking(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to start location tracking.');
      console.error(error);
    }
  };

  // Stop tracking
  const stopTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    setIsTracking(false);
    setSpeed(0);
    setGpsAccuracy(null);
    setTargetVolume(1);
    setLastVolumeLevel(7);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locationSubscription]);

  // Update threshold
  const updateThreshold = (index: number, field: 'speed' | 'volume', value: number) => {
    const newThresholds = [...thresholds];
    newThresholds[index] = { ...newThresholds[index], [field]: value };
    setThresholds(newThresholds);
  };

  const getVolumeColor = (vol: number) => {
    if (vol <= 0.2) return '#ff4757';
    if (vol <= 0.4) return '#ff6348';
    if (vol <= 0.6) return '#ffa502';
    if (vol <= 0.8) return '#7bed9f';
    return '#00ff88';
  };

  const accuracyInfo = getAccuracyLabel(gpsAccuracy);
  const displaySpeed = devMode ? manualSpeed : speed; // Render
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header with dev mode toggle */}
      <View style={styles.header}>
        <Text style={styles.title}>🚴 Pedal Amp</Text>
        <View style={styles.devToggle}>
          <Text style={styles.devLabel}>DEV</Text>
          <Switch
            value={devMode}
            onValueChange={setDevMode}
            trackColor={{ false: '#333', true: '#00d9ff' }}
            thumbColor={devMode ? '#fff' : '#888'}
          />
        </View>
      </View>

      {/* Speed Display */}
      <View style={styles.speedContainer}>
        <Text style={styles.speedValue}>{displaySpeed.toFixed(1)}</Text>
        <Text style={styles.speedUnit}>mph</Text>
        <Text style={styles.speedLabel}>{getCurrentLabel()}</Text>
      </View>

      {/* Dev Mode: Speed Slider */}
      {devMode && (
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Test Speed: {manualSpeed.toFixed(1)} mph</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={20}
            value={manualSpeed}
            onValueChange={setManualSpeed}
            minimumTrackTintColor="#00d9ff"
            maximumTrackTintColor="#333"
            thumbTintColor="#00d9ff"
          />
        </View>
      )}

      {/* GPS Confidence (only when not in dev mode) */}
      {!devMode && isTracking && (
        <View style={styles.gpsContainer}>
          <Text style={styles.gpsLabel}>GPS Accuracy</Text>
          <Text style={[styles.gpsValue, { color: accuracyInfo.color }]}>
            {accuracyInfo.label} {gpsAccuracy !== null ? `(±${gpsAccuracy.toFixed(0)}m)` : ''}
          </Text>
        </View>
      )}

      {/* Volume Display */}
      <View style={styles.volumeContainer}>
        <Text style={styles.volumeLabel}>Target Volume</Text>
        <View style={styles.volumeBar}>
          <View style={[styles.volumeFill, { width: `${targetVolume * 100}%`, backgroundColor: getVolumeColor(targetVolume) }]} />
        </View>
        <Text style={[styles.volumeValue, { color: getVolumeColor(targetVolume) }]}>{Math.round(targetVolume * 100)}%</Text>
      </View>

      {/* Control Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, isTracking ? styles.buttonStop : styles.buttonStart]}
          onPress={isTracking ? stopTracking : startTracking}
        >
          <Text style={styles.buttonText}>
            {isTracking ? '⏹ STOP' : '▶ START'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
        >
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {isTracking && !devMode && (
        <Text style={styles.status}>📍 Tracking active</Text>
      )}
      {devMode && (
        <Text style={styles.status}> Dev mode: Use slider to test</Text>
      )}

      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Volume Levels</Text>
            <Text style={styles.modalSubtitle}>Drag sliders to set volume at each speed</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thresholdScrollView}
              contentContainerStyle={styles.thresholdScrollContent}
            >
              {thresholds.map((t, i) => (
                <View key={i} style={styles.thresholdCard}>
                  <Text style={styles.thresholdSpeed}>{t.speed}+ mph</Text>
                  <View style={styles.sliderWrapper}>
                    <Slider
                      style={styles.verticalSlider}
                      minimumValue={0}
                      maximumValue={1}
                      step={0.05}
                      value={t.volume}
                      onSlidingComplete={(value) => updateThreshold(i, 'volume', value)}
                      minimumTrackTintColor="#00d9ff"
                      maximumTrackTintColor="#333"
                      thumbTintColor="#00d9ff"
                    />
                  </View>
                  <Text style={styles.thresholdVolume}>{Math.round(t.volume * 100)}%</Text>
                  <Text style={styles.thresholdLabel}>{t.label}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => setThresholds(DEFAULT_THRESHOLDS)}
              >
                <Text style={styles.resetButtonText}>Reset Defaults</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSettings(false)}
              >
                <Text style={styles.closeButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  devToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  devLabel: {
    color: '#00d9ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  speedContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  speedValue: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#00d9ff',
  },
  speedUnit: {
    fontSize: 24,
    color: '#00d9ff',
    marginTop: -10,
  },
  speedLabel: {
    fontSize: 24,
    color: '#fff',
    marginTop: 16,
  },
  sliderContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#252542',
    padding: 16,
    borderRadius: 12,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#00d9ff',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  gpsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gpsLabel: {
    fontSize: 14,
    color: '#888',
  },
  gpsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  volumeContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  volumeLabel: {
    fontSize: 18,
    color: '#888',
    marginBottom: 8,
  },
  volumeBar: {
    width: '80%',
    height: 24,
    backgroundColor: '#333',
    borderRadius: 12,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    borderRadius: 12,
  },
  volumeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 50,
  },
  buttonStart: {
    backgroundColor: '#00ff88',
  },
  buttonStop: {
    backgroundColor: '#ff4757',
  },
  buttonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  settingsButton: {
    backgroundColor: '#333',
    padding: 18,
    borderRadius: 50,
  },
  settingsButtonText: {
    fontSize: 24,
  },
  status: {
    fontSize: 14,
    color: '#00d9ff',
    marginTop: 20,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  thresholdScrollView: {
    maxHeight: 340,
  },
  thresholdScrollContent: {
    paddingHorizontal: 8,
    gap: 6,
  },
  thresholdCard: {
    backgroundColor: '#252542',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 90,
    height: 350,
  },
  thresholdVolume: {
    color: '#00d9ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sliderWrapper: {
    flex: 1,
    width: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  verticalSlider: {
    width: 180, // Visual height: 180 * 1.4 = 252
    height: 40,
    transform: [
      { rotate: '-90deg' },
      { scaleX: 1.4 },
      { scaleY: 1.4 }
    ],
  },
  thresholdSpeed: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  thresholdLabel: {
    color: '#888',
    fontSize: 10,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#888',
    fontSize: 16,
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#00d9ff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
