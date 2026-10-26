import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load Supabase credentials from backend/.env or .env
let url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
      if (k === 'SUPABASE_SERVICE_ROLE_KEY' && !serviceKey) serviceKey = val;
    }
  }
}

if (!url || !serviceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env files.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Delete tables in foreign-key dependency order (children first)
const tablesInOrder = [
  'order_items',
  'reviews',
  'contact_unlocks',
  'notifications',
  'seller_payouts',
  'orders',
  'listings',
  'seller_profiles',
  'categories',
  'users',
  'haat_markets',
];

async function wipeDatabase() {
  console.log('========================================================');
  console.log('🧹 STARTING FULL DATABASE WIPE (MOCK DATA PURGE)');
  console.log(`🔗 Target URL: ${url}`);
  console.log('========================================================\n');

  // 1. Wipe rows from tables
  for (const table of tablesInOrder) {
    try {
      // Check count before
      const { count: beforeCount, error: countErr } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (countErr) {
        console.log(`ℹ️  [${table}] Table does not exist or inaccessible (${countErr.message})`);
        continue;
      }

      console.log(`⏳ [${table}] Deleting ${beforeCount ?? 0} rows...`);

      // Delete all records where id is not null (or gt empty string for text primary keys)
      // We try .not('id', 'is', null) first, then fallback to .neq('id', '00000000-0000-0000-0000-000000000000') or gt created_at
      let { error: delErr } = await supabase
        .from(table)
        .delete()
        .not('id', 'is', null);

      if (delErr) {
        // Fallback for tables where id might be text or different condition
        const fallback = await supabase
          .from(table)
          .delete()
          .neq('id', '___non_existent_key___');
        delErr = fallback.error;
      }

      if (delErr) {
        console.error(`❌ [${table}] Delete failed: ${delErr.message}`);
      } else {
        // Verify count after
        const { count: afterCount } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        console.log(`✅ [${table}] Cleaned! Remaining rows: ${afterCount ?? 0}`);
      }
    } catch (err) {
      console.error(`❌ [${table}] Exception during wipe:`, err.message);
    }
  }

  // 2. Wipe Auth Users from Supabase Auth (if any test users exist)
  console.log('\n⏳ Checking Supabase Auth Users (auth.users)...');
  try {
    const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
    if (authErr) {
      console.warn(`⚠️  Could not list auth users: ${authErr.message}`);
    } else {
      const usersList = authData?.users || [];
      console.log(`Found ${usersList.length} auth.users records.`);
      for (const u of usersList) {
        const { error: uErr } = await supabase.auth.admin.deleteUser(u.id);
        if (uErr) {
          console.warn(`⚠️  Failed to delete auth user ${u.id}: ${uErr.message}`);
        } else {
          console.log(`   - Deleted auth user: ${u.email || u.phone || u.id}`);
        }
      }
      console.log('✅ Supabase Auth users wiped.');
    }
  } catch (authEx) {
    console.warn(`⚠️  Auth wipe exception: ${authEx.message}`);
  }

  // 3. Final Verification
  console.log('\n========================================================');
  console.log('📊 FINAL TABLE ROW COUNT VERIFICATION');
  console.log('========================================================');
  let allClean = true;
  for (const table of tablesInOrder) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    if (!error) {
      console.log(`  • ${table.padEnd(20)}: ${count} rows`);
      if (count && count > 0) allClean = false;
    }
  }

  if (allClean) {
    console.log('\n🎉 SUCCESS: All mock data rows wiped while preserving table structures!');
  } else {
    console.warn('\n⚠️ WARNING: Some tables still contain rows.');
  }
}

wipeDatabase().catch((err) => {
  console.error('Fatal wipe error:', err);
  process.exit(1);
});
