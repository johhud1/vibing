import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

import { mapSpeedToVolume } from '../mapping/speedMapping';
import { ExponentialMovingAverage } from '../smoothing/ema';
import { SystemVolume } from '../native/SystemVolume';
import { speedFromLocation } from './speedService';

export const LOCATION_TASK_NAME = 'vibing-location-task';

export type RideMode = 'walk' | 'bike';

export type RideSettings = {
  mode: RideMode;
  minVolume: number;
  maxVolume: number;
};

const smoothing = new ExponentialMovingAverage(0.25);
let lastUpdate = 0;
let currentSettings: RideSettings = {
  mode: 'bike',
  minVolume: 0.2,
  maxVolume: 0.9,
};

export function updateRideSettings(next: Partial<RideSettings>) {
  currentSettings = { ...currentSettings, ...next };
}

function mappingForMode(mode: RideMode, minVolume: number, maxVolume: number) {
  const maxSpeedMps = mode === 'walk' ? 2.5 : 9.0;
  return { minSpeedMps: 0, maxSpeedMps, minVolume, maxVolume };
}

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    return;
  }
  const locations = data?.locations as Location.LocationObject[] | undefined;
  if (!locations || locations.length === 0) {
    return;
  }

  const latest = locations[locations.length - 1];
  const sample = speedFromLocation(latest);
  const smoothed = smoothing.update(sample.speedMps);
  const mapping = mappingForMode(currentSettings.mode, currentSettings.minVolume, currentSettings.maxVolume);
  const target = mapSpeedToVolume(smoothed, mapping);

  const now = Date.now();
  if (now - lastUpdate < 500) {
    return;
  }
  lastUpdate = now;
  await SystemVolume.setVolume(target);
});

export async function startBackgroundUpdates() {
  const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (started) return;

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Highest,
    distanceInterval: 3,
    timeInterval: 1000,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Vibing is active',
      notificationBody: 'Adjusting volume based on speed',
    },
  });
}

export async function stopBackgroundUpdates() {
  const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (!started) return;
  await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
}
