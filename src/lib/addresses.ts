import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { UserAddress, User } from '../types';

export const USER_ADDRESSES_STORAGE_PREFIX = '@thaluwa_user_addresses_';

/**
 * Formats a UserAddress object into a single readable string
 */
export function formatAddressString(addr: UserAddress | null | undefined): string {
  if (!addr) return '';
  const parts = [
    addr.street,
    addr.village,
    addr.district ? `${addr.district} (Assam)` : '',
    addr.pincode ? `- ${addr.pincode}` : '',
  ].filter(Boolean);
  return parts.join(', ');
}

/**
 * Fetches user addresses from local cache with Supabase cloud sync
 */
export async function fetchUserAddresses(user: User): Promise<UserAddress[]> {
  const storageKey = `${USER_ADDRESSES_STORAGE_PREFIX}${user.id}`;
  let localAddresses: UserAddress[] = [];

  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (raw) {
      localAddresses = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[addresses] Failed to read cached addresses:', err);
  }

  // If local list is empty but user profile has an address, seed it
  if (localAddresses.length === 0 && user.address) {
    const seeded: UserAddress = {
      id: `addr-primary-${user.id}`,
      user_id: user.id,
      name: user.name || 'Primary Address',
      phone: user.phone || '',
      type: 'home',
      street: user.address,
      village: user.village || '',
      district: user.district || 'Darrang',
      pincode: user.pincode || '',
      is_default: true,
      lat: user.lat,
      lng: user.lng,
      created_at: new Date().toISOString(),
    };
    localAddresses = [seeded];
    await AsyncStorage.setItem(storageKey, JSON.stringify(localAddresses));
  }

  // Attempt to fetch fresh addresses from Supabase
  try {
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const remoteAddresses: UserAddress[] = data.map((item: any) => ({
        id: String(item.id),
        user_id: String(item.user_id),
        name: item.name || user.name || 'Delivery Address',
        phone: item.phone || user.phone || '',
        type: (item.type as 'home' | 'work' | 'farm') || 'home',
        street: item.street || '',
        village: item.village || '',
        district: item.district || 'Darrang',
        pincode: item.pincode || '',
        landmark: item.landmark || undefined,
        is_default: Boolean(item.is_default),
        lat: item.lat ? Number(item.lat) : undefined,
        lng: item.lng ? Number(item.lng) : undefined,
        created_at: item.created_at,
      }));

      await AsyncStorage.setItem(storageKey, JSON.stringify(remoteAddresses));
      return remoteAddresses;
    }
  } catch (remoteErr) {
    console.warn('[addresses] Supabase fetch failed, using local cache:', remoteErr);
  }

  return localAddresses;
}

/**
 * Saves or updates a user address locally and syncs to Supabase
 */
export async function saveUserAddress(
  user: User,
  addressData: Omit<UserAddress, 'id' | 'user_id' | 'created_at'>,
  existingId?: string
): Promise<UserAddress> {
  const storageKey = `${USER_ADDRESSES_STORAGE_PREFIX}${user.id}`;
  let current = await fetchUserAddresses(user);

  const addressId = existingId || `addr-${Date.now()}`;
  const now = new Date().toISOString();

  // If marked as default or it's the very first address, unset other defaults
  const isDefault = addressData.is_default || current.length === 0;

  if (isDefault) {
    current = current.map((a) => ({ ...a, is_default: false }));
  }

  const savedItem: UserAddress = {
    id: addressId,
    user_id: user.id,
    ...addressData,
    is_default: isDefault,
    created_at: now,
  };

  if (existingId) {
    current = current.map((a) => (a.id === existingId ? savedItem : a));
  } else {
    current = [savedItem, ...current];
  }

  // Save to local cache
  await AsyncStorage.setItem(storageKey, JSON.stringify(current));

  // Sync to Supabase
  try {
    if (isDefault) {
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    // Only pass id if not synthetic client ID or if already an existing UUID
    const isSynthetic = addressId.startsWith('addr-');
    const upsertPayload: Record<string, any> = {
      user_id: user.id,
      name: savedItem.name,
      phone: savedItem.phone,
      type: savedItem.type,
      street: savedItem.street,
      village: savedItem.village,
      district: savedItem.district,
      pincode: savedItem.pincode,
      landmark: savedItem.landmark || null,
      is_default: savedItem.is_default,
      lat: savedItem.lat || null,
      lng: savedItem.lng || null,
    };

    if (!isSynthetic) {
      upsertPayload.id = addressId;
    }

    const { data: upsertData } = await supabase
      .from('user_addresses')
      .upsert(upsertPayload)
      .select()
      .single();

    if (upsertData && upsertData.id && isSynthetic) {
      // Update local storage with genuine Supabase UUID
      savedItem.id = String(upsertData.id);
      current = current.map((a) => (a.id === addressId ? savedItem : a));
      await AsyncStorage.setItem(storageKey, JSON.stringify(current));
    }
  } catch (err) {
    console.warn('[addresses] Supabase upsert failed, preserved in local storage:', err);
  }

  return savedItem;
}

/**
 * Deletes a user address from local storage and Supabase
 */
export async function deleteUserAddress(user: User, addressId: string): Promise<UserAddress[]> {
  const storageKey = `${USER_ADDRESSES_STORAGE_PREFIX}${user.id}`;
  let current = await fetchUserAddresses(user);

  const wasDefault = current.find((a) => a.id === addressId)?.is_default;
  current = current.filter((a) => a.id !== addressId);

  // If we deleted the default address, promote the first remaining
  if (wasDefault && current.length > 0) {
    current[0].is_default = true;
  }

  await AsyncStorage.setItem(storageKey, JSON.stringify(current));

  try {
    await supabase.from('user_addresses').delete().eq('id', addressId).eq('user_id', user.id);
    if (wasDefault && current.length > 0) {
      await supabase.from('user_addresses').update({ is_default: true }).eq('id', current[0].id);
    }
  } catch (err) {
    console.warn('[addresses] Supabase delete failed, removed from local storage:', err);
  }

  return current;
}

/**
 * Sets an address as the default delivery address
 */
export async function setDefaultUserAddress(user: User, addressId: string): Promise<UserAddress[]> {
  const storageKey = `${USER_ADDRESSES_STORAGE_PREFIX}${user.id}`;
  let current = await fetchUserAddresses(user);

  current = current.map((a) => ({
    ...a,
    is_default: a.id === addressId,
  }));

  await AsyncStorage.setItem(storageKey, JSON.stringify(current));

  try {
    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);

    await supabase
      .from('user_addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('user_id', user.id);
  } catch (err) {
    console.warn('[addresses] Supabase setDefault failed, updated in local storage:', err);
  }

  return current;
}
