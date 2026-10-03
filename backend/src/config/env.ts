import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : ['*'],
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://dhzoagvazmamigxobjcd.supabase.co',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  EXPO_ACCESS_TOKEN: process.env.EXPO_ACCESS_TOKEN || '',
};
