import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Supabase credentials (uses env if present, with graceful offline-resilient fallback)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mock-thaluwabazar.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key-thaluwa-bazar';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
