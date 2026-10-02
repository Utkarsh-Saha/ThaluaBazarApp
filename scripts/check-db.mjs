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

if (!url || !key) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function inspectDatabase() {
  console.log('====================================================');
  console.log('🌿 THALUWA BAZAR (থলুৱা বজাৰ) — DATABASE INSPECTOR');
  console.log('====================================================\n');

  const tables = [
    { name: 'categories', label: 'Categories (শ্ৰেণী)' },
    { name: 'haat_markets', label: 'Weekly Haats (সাপ্তাহিক বজাৰ)' },
    { name: 'listings', label: 'Listings / Products (সামগ্ৰী)' },
    { name: 'users', label: 'Registered Users (ব্যৱহাৰকাৰী)' },
    { name: 'seller_profiles', label: 'Seller Profiles (বিক্ৰেতা)' },
    { name: 'orders', label: 'Orders (অৰ্ডাৰসমূহ)' },
    { name: 'order_items', label: 'Order Items (অৰ্ডাৰৰ বস্তুসমূহ)' },
    { name: 'contact_unlocks', label: 'Masked Contact Unlocks (ফোন নম্বৰ আনলক)' },
  ];

  for (const { name, label } of tables) {
    try {
      const { data, error, count } = await supabase
        .from(name)
        .select('*', { count: 'exact' });

      console.log(`\n📋 TABLE: [${name}] — ${label}`);
      console.log('----------------------------------------------------');

      if (error) {
        console.log(`⚠️  Status: Error / Not Found (${error.message})`);
        continue;
      }

      console.log(`📊 Total Records: ${data?.length || 0}`);

      if (!data || data.length === 0) {
        console.log('   (Table is currently empty)');
      } else {
        // Pretty print first 5 rows in console table format
        const preview = data.slice(0, 5).map(row => {
          const simplified = {};
          for (const [k, v] of Object.entries(row)) {
            // Trim long strings for clean table display
            if (typeof v === 'string' && v.length > 30) {
              simplified[k] = v.substring(0, 27) + '...';
            } else {
              simplified[k] = v;
            }
          }
          return simplified;
        });
        console.table(preview);
        if (data.length > 5) {
          console.log(`   ... and ${data.length - 5} more records.`);
        }
      }
    } catch (e) {
      console.log(`❌ Exception inspecting ${name}: ${e.message}`);
    }
  }

  // Storage Buckets check
  console.log('\n\n📦 STORAGE BUCKETS:');
  console.log('----------------------------------------------------');
  try {
    const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
    if (bErr) {
      console.log(`⚠️  Storage error: ${bErr.message}`);
    } else if (buckets && buckets.length > 0) {
      for (const b of buckets) {
        console.log(`📁 Bucket: "${b.name}" (Public: ${b.public})`);
      }
    } else {
      console.log('   (No storage buckets created yet)');
    }
  } catch (e) {
    console.log(`❌ Storage Exception: ${e.message}`);
  }

  console.log('\n====================================================\n');
}

inspectDatabase();
