import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve('.env');
let url = process.env.EXPO_PUBLIC_SUPABASE_URL;
let key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    if (k === 'EXPO_PUBLIC_SUPABASE_URL') url = v.join('=').trim();
    if (k === 'EXPO_PUBLIC_SUPABASE_ANON_KEY') key = v.join('=').trim();
  }
}

console.log('--- 🔍 Testing Supabase Connection ---');
console.log('Project URL:', url);

if (!url || !key) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function runTests() {
  const tables = ['categories', 'haat_markets', 'listings', 'users', 'orders'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.log(`❌ Table "${table}": ${error.message} (Code: ${error.code})`);
      } else {
        console.log(`✅ Table "${table}": Connected! Found ${data?.length || 0} rows.`);
      }
    } catch (e) {
      console.log(`❌ Table "${table}": ${e.message}`);
    }
  }

  console.log('\n--- 📦 Testing Storage Buckets ---');
  try {
    const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
    if (bErr) {
      console.log(`❌ Storage Buckets: ${bErr.message}`);
    } else {
      console.log(`✅ Storage: Found ${buckets?.length || 0} buckets:`, buckets?.map(b => b.name).join(', ') || 'None');
    }
  } catch (e) {
    console.log(`❌ Storage Exception: ${e.message}`);
  }
}

runTests();
