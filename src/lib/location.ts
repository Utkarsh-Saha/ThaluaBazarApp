import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const USER_COORDS_STORAGE_KEY = '@thaluwa_user_coords';

export interface UserCoords {
  lat: number;
  lng: number;
  district: string;
  village?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  landmark?: string;
  formattedAddress: string;
  isCustomSelected?: boolean;
}

export type DetailedAddress = UserCoords;

// 35 Administrative Districts of Assam
export const ASSAM_DISTRICTS = [
  'Baksa',
  'Bajali',
  'Barpeta',
  'Biswanath',
  'Bongaigaon',
  'Cachar',
  'Charaideo',
  'Chirang',
  'Darrang',
  'Dhemaji',
  'Dhubri',
  'Dibrugarh',
  'Dima Hasao',
  'Goalpara',
  'Golaghat',
  'Hailakandi',
  'Hojai',
  'Jorhat',
  'Kamrup Metropolitan',
  'Kamrup Rural',
  'Karbi Anglong',
  'Karimganj',
  'Kokrajhar',
  'Lakhimpur',
  'Majuli',
  'Morigaon',
  'Nagaon',
  'Nalbari',
  'Sivasagar',
  'Sonitpur',
  'South Salmara-Mankachar',
  'Tamulpur',
  'Tinsukia',
  'Udalguri',
  'West Karbi Anglong',
] as const;

export type AssamDistrict = (typeof ASSAM_DISTRICTS)[number] | string;

// Centroids for Assam district centers
export const ASSAM_DISTRICT_CENTROIDS: Record<string, { lat: number; lng: number; village: string }> = {
  Darrang: { lat: 26.435, lng: 92.03, village: 'Mangaldai' },
  'Kamrup Metropolitan': { lat: 26.1445, lng: 91.7362, village: 'Guwahati' },
  'Kamrup Rural': { lat: 26.1856, lng: 91.6782, village: 'Amingaon' },
  Sonitpur: { lat: 26.6528, lng: 92.7926, village: 'Tezpur' },
  Morigaon: { lat: 26.2575, lng: 92.3429, village: 'Morigaon Town' },
  Nagaon: { lat: 26.3452, lng: 92.684, village: 'Nagaon Town' },
  Udalguri: { lat: 26.7454, lng: 92.0962, village: 'Udalguri Town' },
  Barpeta: { lat: 26.3211, lng: 91.0068, village: 'Barpeta Town' },
  Nalbari: { lat: 26.4439, lng: 91.4402, village: 'Nalbari Town' },
  Baksa: { lat: 26.5843, lng: 91.4168, village: 'Musalpur' },
  Biswanath: { lat: 26.73, lng: 93.15, village: 'Biswanath Chariali' },
  Golaghat: { lat: 26.52, lng: 93.97, village: 'Golaghat Town' },
  Jorhat: { lat: 26.7509, lng: 94.2037, village: 'Jorhat Town' },
  Sivasagar: { lat: 26.9826, lng: 94.6425, village: 'Sivasagar Town' },
  Dibrugarh: { lat: 27.4728, lng: 94.912, village: 'Dibrugarh Town' },
  Tinsukia: { lat: 27.5, lng: 95.3667, village: 'Tinsukia Town' },
  Lakhimpur: { lat: 27.23, lng: 94.1, village: 'North Lakhimpur' },
  Dhemaji: { lat: 27.48, lng: 94.58, village: 'Dhemaji Town' },
  Majuli: { lat: 26.96, lng: 94.22, village: 'Garamur' },
  Cachar: { lat: 24.8333, lng: 92.7789, village: 'Silchar' },
  Karimganj: { lat: 24.8667, lng: 92.35, village: 'Karimganj Town' },
  Hailakandi: { lat: 24.6833, lng: 92.5667, village: 'Hailakandi Town' },
  Bongaigaon: { lat: 26.48, lng: 90.56, village: 'Bongaigaon Town' },
  Kokrajhar: { lat: 26.4014, lng: 90.2718, village: 'Kokrajhar Town' },
  Chirang: { lat: 26.5412, lng: 90.5218, village: 'Kajalgaon' },
  Goalpara: { lat: 26.18, lng: 90.62, village: 'Goalpara Town' },
  Dhubri: { lat: 26.02, lng: 89.98, village: 'Dhubri Town' },
  'South Salmara-Mankachar': { lat: 25.86, lng: 89.87, village: 'Hatsingimari' },
  'Karbi Anglong': { lat: 25.845, lng: 93.435, village: 'Diphu' },
  'West Karbi Anglong': { lat: 25.86, lng: 92.5, village: 'Hamren' },
  'Dima Hasao': { lat: 25.18, lng: 93.03, village: 'Haflong' },
  Hojai: { lat: 26.0, lng: 92.86, village: 'Hojai Town' },
  Bajali: { lat: 26.48, lng: 91.18, village: 'Pathsala' },
  Tamulpur: { lat: 26.63, lng: 91.57, village: 'Tamulpur Town' },
  Charaideo: { lat: 26.94, lng: 94.92, village: 'Sonari' },
};

// Default fallback to Mangaldai, Darrang, Assam (Hyperlocal central cluster)
export const DEFAULT_COORDS: UserCoords = {
  lat: 26.435,
  lng: 92.03,
  district: 'Darrang',
  village: 'Mangaldai',
  formattedAddress: 'Mangaldai, Darrang (Assam)',
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
 * Finds the nearest Assam district centroid from arbitrary GPS coordinates
 */
export function findNearestAssamDistrict(lat: number, lng: number): { district: string; village: string; distanceKm: number } {
  let closestDistrict = 'Darrang';
  let closestVillage = 'Mangaldai';
  let minDistance = Infinity;

  for (const [distName, info] of Object.entries(ASSAM_DISTRICT_CENTROIDS)) {
    const dist = calculateDistanceKm(lat, lng, info.lat, info.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestDistrict = distName;
      closestVillage = info.village;
    }
  }

  return {
    district: closestDistrict,
    village: closestVillage,
    distanceKm: minDistance,
  };
}

/**
 * Reverse geocodes latitude/longitude into locality, street, village, and Assam district
 */
export async function reverseGeocodeCoordsAsync(lat: number, lng: number): Promise<DetailedAddress> {
  try {
    const geocoded = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });

    if (geocoded && geocoded.length > 0) {
      const first = geocoded[0];
      
      // 1. Match against known Assam districts
      const rawCandidates = [first.district, first.subregion, first.city, first.region].filter(Boolean) as string[];
      let matchedDistrict: string | null = null;
      for (const cand of rawCandidates) {
        for (const d of ASSAM_DISTRICTS) {
          if (cand.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(cand.toLowerCase())) {
            matchedDistrict = d;
            break;
          }
        }
        if (matchedDistrict) break;
      }

      // Fallback to closest centroid if no direct district match
      if (!matchedDistrict) {
        const nearest = findNearestAssamDistrict(lat, lng);
        matchedDistrict = nearest.district;
      }

      // 2. City / Locality
      const city = first.city || first.subregion || matchedDistrict;

      // 3. Village / Town (Rural Assam frequently maps gaon/village to subregion or name)
      let village = '';
      if (first.name && first.name !== first.city && first.name !== first.district && first.name !== first.street) {
        village = first.name;
      } else if (first.city && first.city !== matchedDistrict) {
        village = first.city;
      } else if (first.subregion && first.subregion !== matchedDistrict) {
        village = first.subregion;
      } else {
        village = ASSAM_DISTRICT_CENTROIDS[matchedDistrict]?.village || 'Local Area';
      }

      // 4. Street / House No / Ward
      const streetParts = [first.streetNumber, first.street].filter(Boolean);
      let street = streetParts.join(' ').trim();
      if (!street && first.name && first.name !== village && first.name !== city && first.name !== matchedDistrict) {
        street = first.name;
      }

      // 5. Landmark
      let landmark: string | undefined = undefined;
      if (first.name && first.name !== street && first.name !== village && first.name !== city && first.name !== matchedDistrict) {
        landmark = `Near ${first.name}`;
      }

      // 6. Region / State & Country
      const state = first.region || 'Assam';
      const country = first.country || 'India';
      const pincode = first.postalCode || undefined;

      // 7. Formatted Address (clean and deduplicated)
      const parts: string[] = [];
      if (street) parts.push(street);
      if (village && village !== street) parts.push(village);
      if (city && city !== village && city !== matchedDistrict) parts.push(city);
      if (matchedDistrict) parts.push(matchedDistrict);
      if (state && state !== matchedDistrict) parts.push(state);
      if (pincode) parts.push(pincode);

      const formattedAddress = parts.length > 0 ? parts.join(', ') : `${village}, ${matchedDistrict} (Assam)`;

      return {
        lat,
        lng,
        district: matchedDistrict,
        village,
        street: street || undefined,
        city,
        state,
        country,
        pincode,
        landmark,
        formattedAddress,
      };
    }
  } catch (err) {
    console.warn('[location] reverseGeocodeAsync failed, falling back to centroid:', err);
  }

  // Fallback to closest centroid if reverse geocode service is unavailable
  const nearest = findNearestAssamDistrict(lat, lng);
  return {
    lat,
    lng,
    district: nearest.district,
    village: nearest.village,
    city: nearest.village,
    state: 'Assam',
    country: 'India',
    formattedAddress: `${nearest.village}, ${nearest.district} (Assam)`,
  };
}

/**
 * Save detected coordinates to AsyncStorage
 */
export async function saveUserCoordsToStorage(coords: UserCoords): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_COORDS_STORAGE_KEY, JSON.stringify(coords));
  } catch (err) {
    console.warn('[location] Failed to cache user coords:', err);
  }
}

/**
 * Load cached user coordinates from AsyncStorage
 */
export async function loadSavedUserCoords(): Promise<UserCoords | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_COORDS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as UserCoords;
    }
  } catch (err) {
    console.warn('[location] Failed to load cached user coords:', err);
  }
  return null;
}

export interface GetGPSAddressOptions {
  throwOnError?: boolean;
  accuracy?: Location.Accuracy;
}

/**
 * Requests GPS permission, retrieves current coordinates, performs reverse geocoding,
 * and caches the result. Supports throwing typed errors for UI error handling.
 */
export async function getDetailedAddressFromGPS(
  options: GetGPSAddressOptions = {}
): Promise<DetailedAddress> {
  const { throwOnError = false, accuracy = Location.Accuracy.Balanced } = options;

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    if (throwOnError) {
      const err = new Error('PERMISSION_DENIED');
      (err as any).code = 'PERMISSION_DENIED';
      throw err;
    }
    const cached = await loadSavedUserCoords();
    return cached || DEFAULT_COORDS;
  }

  try {
    const loc = await Location.getCurrentPositionAsync({ accuracy });
    const address = await reverseGeocodeCoordsAsync(loc.coords.latitude, loc.coords.longitude);
    await saveUserCoordsToStorage(address);
    return address;
  } catch (error) {
    console.warn('[location] GPS retrieval error:', error);
    if (throwOnError) {
      throw error;
    }
    const cached = await loadSavedUserCoords();
    return cached || DEFAULT_COORDS;
  }
}

/**
 * Requests GPS permission, retrieves current coordinates, and performs reverse geocoding
 */
export async function getCurrentUserLocation(): Promise<UserCoords> {
  return getDetailedAddressFromGPS({ throwOnError: false });
}
