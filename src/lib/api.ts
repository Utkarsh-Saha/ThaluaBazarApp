import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

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
    const url = `${BACKEND_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    // Retrieve stored auth token if present
    let authHeader: Record<string, string> = {};
    try {
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        authHeader = { Authorization: `Bearer ${token}` };
      }
    } catch {
      // Ignore storage read errors
    }

    const headers = {
      'Content-Type': 'application/json',
      ...authHeader,
      ...(options.headers || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    return {
      success: response.ok && data.success !== false,
      data: data,
      error: data.error,
    };
  } catch (err: any) {
    console.warn(`[API] Request to ${endpoint} failed:`, err.message);
    return {
      success: false,
      error: err.message || 'Network request failed',
    };
  }
}
