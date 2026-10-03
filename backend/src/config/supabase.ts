import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV } from './env.js';

if (!ENV.SUPABASE_URL || (!ENV.SUPABASE_ANON_KEY && !ENV.SUPABASE_SERVICE_ROLE_KEY)) {
  console.warn('⚠️ Supabase credentials missing in backend environment variables.');
}

// Admin / Service Client with full privileges (falls back to Anon Key if Service Role is not provided)
export const supabaseAdmin: SupabaseClient = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Public / Anon Client
export const supabasePublic: SupabaseClient = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
    },
  }
);
