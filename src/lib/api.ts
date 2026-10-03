import { Platform } from 'react-native';

// Default backend URL based on platform
const getDefaultBackendUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/v1'; // Android Emulator
  }
  return 'http://localhost:5000/api/v1'; // iOS simulator or web
};

export const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || getDefaultBackendUrl();

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const url = `${BACKEND_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = {
      'Content-Type': 'application/json',
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
