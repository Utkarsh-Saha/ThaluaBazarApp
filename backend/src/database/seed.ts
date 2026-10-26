import { supabaseAdmin } from '../config/supabase.js';

/**
 * Thaluwa Bazar Database Seed Script
 * 
 * Note: Automatic mock data insertion has been disabled to ensure the database
 * remains clean and unpopulated with dummy records.
 * 
 * To seed initial product categories or custom data, populate and execute this script.
 */
async function runSeed() {
  console.log('🌱 Thaluwa Bazar Database Seed script initialized.');
  console.log('ℹ️ Mock data auto-insertion is disabled to preserve a clean database.');
  console.log('No mock data rows were inserted.');
}

runSeed().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
