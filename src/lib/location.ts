import * as Location from 'expo-location';

export interface UserCoords {
  lat: number;
  lng: number;
  district?: string;
  address?: string;
}

// Default fallback to Mangaldai, Darrang, Assam (Center of Brahmaputra valley)
export const DEFAULT_COORDS: UserCoords = {
  lat: 26.4350,
  lng: 92.0300,
  district: 'Darrang',
  address: 'Mangaldai, Assam',
};

/**
 * Calculates distance between two points on earth using Haversine formula (matches PostGIS ST_DWithin / geography)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // 1 decimal place
}

/**
 * Requests GPS permission and retrieves current coordinates
 */
export async function getCurrentUserLocation(): Promise<UserCoords> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return DEFAULT_COORDS;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      address: 'Current GPS Location',
      district: 'Assam',
    };
  } catch (error) {
    console.warn('GPS retrieval fallback:', error);
    return DEFAULT_COORDS;
  }
}
