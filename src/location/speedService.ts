import * as Location from 'expo-location';

export type SpeedSample = {
  speedMps: number;
  rawSpeedMps: number | null;
  timestamp: number;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
};

let lastLocation: Location.LocationObject | null = null;

export function speedFromLocation(location: Location.LocationObject): SpeedSample {
  const rawSpeed = location.coords.speed ?? -1;

  if (rawSpeed > 0) {
    lastLocation = location;
    return {
      speedMps: rawSpeed,
      rawSpeedMps: rawSpeed,
      timestamp: location.timestamp,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy ?? null,
      altitude: location.coords.altitude ?? null,
      heading: location.coords.heading ?? null,
    };
  }

  if (!lastLocation) {
    lastLocation = location;
    return {
      speedMps: 0,
      rawSpeedMps: rawSpeed > 0 ? rawSpeed : null,
      timestamp: location.timestamp,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy ?? null,
      altitude: location.coords.altitude ?? null,
      heading: location.coords.heading ?? null,
    };
  }

  const distance = distanceBetweenMeters(
    lastLocation.coords.latitude,
    lastLocation.coords.longitude,
    location.coords.latitude,
    location.coords.longitude,
  );
  const seconds = Math.max((location.timestamp - lastLocation.timestamp) / 1000, 0);
  lastLocation = location;
  if (seconds <= 0) {
    return { speedMps: 0, timestamp: location.timestamp };
  }
  return {
    speedMps: distance / seconds,
    rawSpeedMps: rawSpeed > 0 ? rawSpeed : null,
    timestamp: location.timestamp,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy ?? null,
    altitude: location.coords.altitude ?? null,
    heading: location.coords.heading ?? null,
  };
}

export async function ensureLocationPermissions() {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') {
    throw new Error('Location permission denied');
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

export async function getCurrentSample(): Promise<SpeedSample> {
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return speedFromLocation(location);
}

export function resetSpeedHistory() {
  lastLocation = null;
}

function distanceBetweenMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const earthRadiusMeters = 6371000;
  return earthRadiusMeters * c;
}
