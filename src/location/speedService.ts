import * as Location from 'expo-location';

export type SpeedSample = {
  speedMps: number;
  timestamp: number;
};

let lastLocation: Location.LocationObject | null = null;

export function speedFromLocation(location: Location.LocationObject): SpeedSample {
  const rawSpeed = location.coords.speed ?? -1;

  if (rawSpeed > 0) {
    lastLocation = location;
    return { speedMps: rawSpeed, timestamp: location.timestamp };
  }

  if (!lastLocation) {
    lastLocation = location;
    return { speedMps: 0, timestamp: location.timestamp };
  }

  const distance = Location.getDistance(lastLocation.coords, location.coords);
  const seconds = Math.max((location.timestamp - lastLocation.timestamp) / 1000, 0);
  lastLocation = location;
  if (seconds <= 0) {
    return { speedMps: 0, timestamp: location.timestamp };
  }
  return { speedMps: distance / seconds, timestamp: location.timestamp };
}

export async function ensureLocationPermissions() {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') {
    throw new Error('Location permission denied');
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== 'granted') {
    throw new Error('Background location permission denied');
  }
}

export async function startForegroundWatch(
  onUpdate: (sample: SpeedSample) => void,
) {
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Highest,
      distanceInterval: 3,
      timeInterval: 1000,
    },
    (location) => {
      onUpdate(speedFromLocation(location));
    },
  );
}

export function resetSpeedHistory() {
  lastLocation = null;
}
