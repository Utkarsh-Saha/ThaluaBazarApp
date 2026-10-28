import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load Supabase credentials
let url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
let key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const envFiles = [
  path.resolve('backend/.env'),
  path.resolve('.env'),
];

for (const file of envFiles) {
  if (fs.existsSync(file)) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [k, ...v] = trimmed.split('=');
      const val = v.join('=').trim();
      if ((k === 'SUPABASE_URL' || k === 'EXPO_PUBLIC_SUPABASE_URL') && !url) url = val;
      if (k === 'SUPABASE_SERVICE_ROLE_KEY' && !key) key = val;
      if (k === 'EXPO_PUBLIC_SUPABASE_ANON_KEY' && !key) key = val;
    }
  }
}

if (!url || !key) {
  console.error('❌ Missing SUPABASE_URL or API Key.');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const tables = [
  'users',
  'seller_profiles',
  'categories',
  'listings',
  'orders',
  'order_items',
  'reviews',
  'notifications',
  'seller_payouts',
  'contact_unlocks',
  'user_addresses',
  'conversations',
  'messages',
  'payment_transactions',
  'audit_logs',
];

async function checkDatabase() {
  console.log('========================================================');
  console.log('🔍 THALUWA BAZAR DATABASE STATUS CHECK');
  console.log(`🔗 Endpoint: ${url}`);
  console.log('========================================================\n');

  let totalRows = 0;
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ [${table.padEnd(18)}] Inaccessible / Error: ${error.message}`);
      } else {
        console.log(`✅ [${table.padEnd(18)}] Active (${count ?? 0} rows)`);
        totalRows += (count ?? 0);
      }
    } catch (err) {
      console.log(`❌ [${table.padEnd(18)}] Exception: ${err.message}`);
    }
  }

  console.log('\n--------------------------------------------------------');
  console.log(`Total Records Across Tables: ${totalRows}`);
  if (totalRows === 0) {
    console.log('✨ Database is completely wiped and ready for clean production data.');
  } else {
    console.log(`ℹ️ Database contains ${totalRows} active records.`);
  }
  console.log('--------------------------------------------------------\n');
}

checkDatabase();
