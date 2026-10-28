import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Thaluwa Bazar Secure Storage Module
 * Uses Android Keystore (AES-256) and iOS Keychain for cryptographic hardware-backed storage.
 * Seamlessly falls back to AsyncStorage for Web.
 */

const isWeb = Platform.OS === 'web';

export async function saveSecureItem(key: string, value: string): Promise<void> {
  try {
    if (isWeb) {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
    }
  } catch (error) {
    console.warn(`[SecureStorage] Failed to set item for key "${key}":`, error);
    // Secondary fallback
    await AsyncStorage.setItem(key, value).catch(() => {});
  }
}

export async function getSecureItem(key: string): Promise<string | null> {
  try {
    if (isWeb) {
      return await AsyncStorage.getItem(key);
    }
    const secureVal = await SecureStore.getItemAsync(key, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
    if (secureVal !== null) {
      return secureVal;
    }
    // Migration fallback: check if previously stored in AsyncStorage
    const legacyVal = await AsyncStorage.getItem(key);
    if (legacyVal !== null) {
      // Migrate to SecureStore and clean up legacy unencrypted store
      await SecureStore.setItemAsync(key, legacyVal, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      }).catch(() => {});
      await AsyncStorage.removeItem(key).catch(() => {});
      return legacyVal;
    }
    return null;
  } catch (error) {
    console.warn(`[SecureStorage] Failed to get item for key "${key}":`, error);
    return await AsyncStorage.getItem(key).catch(() => null);
  }
}

export async function deleteSecureItem(key: string): Promise<void> {
  try {
    if (!isWeb) {
      await SecureStore.deleteItemAsync(key).catch(() => {});
    }
    await AsyncStorage.removeItem(key).catch(() => {});
  } catch (error) {
    console.warn(`[SecureStorage] Failed to delete item for key "${key}":`, error);
  }
}

/**
 * Storage adapter compliant with Supabase auth options.storage
 */
export const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return await getSecureItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await saveSecureItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await deleteSecureItem(key);
  },
};
