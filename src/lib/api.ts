import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getSecureItem, deleteSecureItem } from './secureStorage';
import { enforceHttps, isJwtExpired } from './networkSecurity';

// Default backend URL based on platform & active dev host network IP
const getDefaultBackendUrl = () => {
  // 1. Derive network IP from Metro Host in Expo Go or dev client for physical phones
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:5000/api/v1`;
    }
  }

  // 2. Android emulator loopback
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/v1';
  }

  // 3. Web or iOS simulator fallback
  return 'http://localhost:5000/api/v1';
};

export const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || getDefaultBackendUrl();

export const TOKEN_STORAGE_KEY = '@thaluwa_auth_token';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const rawUrl = `${BACKEND_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const url = enforceHttps(rawUrl);

    // Retrieve stored auth token securely from Keychain / Keystore
    let authHeader: Record<string, string> = {};
    try {
      const token = await getSecureItem(TOKEN_STORAGE_KEY);
      if (token) {
        if (isJwtExpired(token)) {
          console.warn('[API] Stored JWT session has expired. Wiping secure cache.');
          await deleteSecureItem(TOKEN_STORAGE_KEY);
        } else {
          authHeader = { Authorization: `Bearer ${token}` };
        }
      }
    } catch {
      // Ignore storage read errors
    }

    const headers = {
      'Content-Type': 'application/json',
      ...authHeader,
      ...(options.headers || {}),
    };

    // Request timeout via AbortController (15 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Handle 401 Unauthorized: token expired or revoked on server
    if (response.status === 401) {
      console.warn('[API] 401 Unauthorized received. Invalidating local session token.');
      await deleteSecureItem(TOKEN_STORAGE_KEY);
    }

    const data = await response.json();
    return {
      success: response.ok && data.success !== false,
      data: data,
      error: data.error,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        error: 'Network request timed out. Please check your internet connection.',
      };
    }
    console.warn(`[API] Request to ${endpoint} failed:`, err.message);
    return {
      success: false,
      error: err.message || 'Network request failed',
    };
  }
}
