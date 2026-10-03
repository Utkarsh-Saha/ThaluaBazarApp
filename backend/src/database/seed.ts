import { supabaseAdmin } from '../config/supabase.js';

async function runSeed() {
  console.log('🌱 Starting Thaluwa Bazar Database Seed...');

  // 1. Seed Categories
  const categories = [
    { id: 'c1', slug: 'vegetables', name_en: 'Organic Vegetables', name_as: 'জৈৱিক শাক-পাচলি', icon: 'leaf-outline' },
    { id: 'c2', slug: 'dairy', name_en: 'Local Dairy & Ghee', name_as: 'গাখীৰ আৰু ঘিউ', icon: 'water-outline' },
    { id: 'c3', slug: 'handloom', name_en: 'Assam Handloom & Eri/Muga', name_as: 'এৰী-মুগা কাপোৰ', icon: 'shirt-outline' },
    { id: 'c4', slug: 'honey_spices', name_en: 'Wild Honey & Spices', name_as: 'মৌ আৰু মচলা', icon: 'flask-outline' },
    { id: 'c5', slug: 'bamboo_craft', name_en: 'Bamboo & Cane Craft', name_as: 'বাঁহ-বেতৰ শিল্প', icon: 'hammer-outline' },
    { id: 'c6', slug: 'rice_grains', name_en: 'Johar Rice & Grains', name_as: 'জহা চাউল আৰু শস্য', icon: 'grid-outline' },
    { id: 'c7', slug: 'fish_poultry', name_en: 'Local Fish & Poultry', name_as: 'লোকেল মাছ আৰু হাঁহ-কুকুৰা', icon: 'fish-outline' },
  ];

  const { error: catErr } = await supabaseAdmin.from('categories').upsert(categories);
  if (catErr) console.error('Error seeding categories:', catErr);
  else console.log(`✅ Seeded ${categories.length} categories`);

  // 2. Seed Haats
  const haats = [
    {
      id: 'h1',
      name_en: 'Kharupetia Bi-Weekly Haat',
      name_as: 'খাৰুপেটীয়া সাপ্তাহিক বজাৰ',
      district: 'Darrang',
      location: 'Kharupetia Town Center',
      market_day: 'Wednesday & Saturday',
      market_day_as: 'বুধবাৰ আৰু শনিবাৰ',
      timings: '6:00 AM - 2:00 PM',
      specialty_en: 'Fresh river vegetables, organic ginger, wholesale produce',
      specialty_as: 'শাক-পাচলি, জৈৱিক আদা, পাইকাৰী বজাৰ',
      active_sellers_count: 120,
      lat: 26.5167,
      lng: 92.1333,
      image_url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600',
    },
    {
      id: 'h2',
      name_en: 'Mangaldai Daily Bazaar',
      name_as: 'মঙলদৈ দৈনিক বজাৰ',
      district: 'Darrang',
      location: 'Near Clock Tower, Mangaldai',
      market_day: 'Daily (Mon - Sun)',
      market_day_as: 'দৈনিক',
      timings: '7:00 AM - 8:00 PM',
      specialty_en: 'Local dairy, Joha rice, mustard oil, handloom gamusa',
      specialty_as: 'লোকেল গাখীৰ, জহা চাউল, মিঠাতেল, গামোচা',
      active_sellers_count: 85,
      lat: 26.4350,
      lng: 92.0300,
      image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600',
    },
    {
      id: 'h3',
      name_en: 'Sipajhar Friday Haat',
      name_as: 'ছিপাহীঝাৰ শুকুৰবৰীয়া বজাৰ',
      district: 'Darrang',
      location: 'NH-15 Sipajhar Chowk',
      market_day: 'Friday',
      market_day_as: 'শুকুৰবাৰ',
      timings: '6:30 AM - 1:00 PM',
      specialty_en: 'Bamboo handicrafts, Eri silk weaving, village poultry',
      specialty_as: 'বাঁহৰ সাজ-সঁজুলি, এৰী সূতাৰ কাপোৰ, দেশী হাঁহ-কুকুৰা',
      active_sellers_count: 64,
      lat: 26.3900,
      lng: 91.9000,
      image_url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600',
    },
    {
      id: 'h4',
      name_en: 'Deomornoi Farmer Market',
      name_as: 'দেওমৰনৈ কৃষক বজাৰ',
      district: 'Darrang',
      location: 'Deomornoi Higher Secondary Field',
      market_day: 'Sunday',
      market_day_as: 'দেওবাৰ',
      timings: '5:30 AM - 12:30 PM',
      specialty_en: 'Direct farm produce, winter greens, mustard honey',
      specialty_as: 'পথাৰৰ শাক-পাচলি, লফা-লাই শাক, সৰিয়হ মৌ',
      active_sellers_count: 42,
      lat: 26.4700,
      lng: 91.9500,
      image_url: 'https://images.unsplash.com/photo-1506484381205-f7945653044d?w=600',
    },
  ];

  const { error: haatErr } = await supabaseAdmin.from('haat_markets').upsert(haats);
  if (haatErr) console.error('Error seeding haats:', haatErr);
  else console.log(`✅ Seeded ${haats.length} haat markets`);

  // 3. Seed Sample Seller Profiles & Listings
  const sampleListings = [
    {
      seller_id: 'a0000000-0000-0000-0000-000000000001',
      seller_name: 'Jonali Saikia',
      seller_type: 'shg_member',
      seller_phone: '+91 94351 12345',
      category_id: 'c1',
      category_name_en: 'Organic Vegetables',
      category_name_as: 'জৈৱিক শাক-পাচলি',
      title_en: 'Organic Fresh Lai Xaak (Mustard Greens)',
      title_as: 'পথাৰৰ সতেজ লাই শাক (জৈৱিক)',
      description_en: 'Freshly harvested early morning from our organic farm in Sipajhar.',
      description_as: 'ছিপাহীঝাৰৰ জৈৱিক পথাৰৰ পৰা পুৱা সংগ্ৰহ কৰা সতেজ লাই শাক।',
      price: 30,
      unit: 'bundle',
      stock: 40,
      image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600',
      lat: 26.3900,
      lng: 91.9000,
      village: 'Sipajhar',
      district: 'Darrang',
      haat_name: 'Sipajhar Friday Haat',
      rating: 4.9,
      status: 'active',
      is_organic: true,
    },
    {
      seller_id: 'a0000000-0000-0000-0000-000000000002',
      seller_name: 'Pranjal Deka',
      seller_type: 'individual',
      seller_phone: '+91 94352 23456',
      category_id: 'c4',
      category_name_en: 'Wild Honey & Spices',
      category_name_as: 'মৌ আৰু মচলা',
      title_en: 'Pure Wild Forest Honey (500g)',
      title_as: 'বনৰীয়া বিশুদ্ধ মৌ (৫০০ গ্ৰাম)',
      description_en: '100% pure raw unprocessed honey extracted from natural wild bee hives.',
      description_as: '১০০% বিশুদ্ধ প্ৰাকৃতিক মৌজোল। কোনো কৃত্ৰিম উপাদান নাই।',
      price: 350,
      unit: 'bottle',
      stock: 15,
      image_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600',
      lat: 26.4350,
      lng: 92.0300,
      village: 'Mangaldai',
      district: 'Darrang',
      haat_name: 'Mangaldai Daily Bazaar',
      rating: 5.0,
      status: 'active',
      is_organic: true,
    },
    {
      seller_id: 'a0000000-0000-0000-0000-000000000003',
      seller_name: 'Rupali Boro (Pragjyotish SHG)',
      seller_type: 'shg_member',
      seller_phone: '+91 94353 34567',
      category_id: 'c3',
      category_name_en: 'Assam Handloom & Eri/Muga',
      category_name_as: 'এৰী-মুগা কাপোৰ',
      title_en: 'Handwoven Pure Eri Silk Shawl',
      title_as: 'হাতে বোৱা বিশুদ্ধ এৰী চাদৰ',
      description_en: 'Warm, breathable authentic Eri silk shawl hand-loomed by rural artisans.',
      description_as: 'গাঁওলীয়া শিপিনীয়ে হাতেৰে বোৱা উৎকৃষ্ট মানৰ এৰী চাদৰ।',
      price: 1850,
      unit: 'piece',
      stock: 8,
      image_url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600',
      lat: 26.5167,
      lng: 92.1333,
      village: 'Kharupetia',
      district: 'Darrang',
      haat_name: 'Kharupetia Bi-Weekly Haat',
      rating: 4.8,
      status: 'active',
      is_organic: true,
    },
    {
      seller_id: 'a0000000-0000-0000-0000-000000000004',
      seller_name: 'Bhaben Kalita',
      seller_type: 'small_business',
      seller_phone: '+91 94354 45678',
      category_id: 'c6',
      category_name_en: 'Johar Rice & Grains',
      category_name_as: 'জহা চাউল আৰু শস্য',
      title_en: 'Aromatic Kola Joha Rice (1 kg)',
      title_as: 'সুগন্ধি ক’লা জহা চাউল (১ কেজি)',
      description_en: 'Traditional Assamese aromatic Joha rice with rich fragrance.',
      description_as: 'পৰম্পৰাগত সুবাসযুক্ত অসমীয়া ক’লা জহা চাউল।',
      price: 120,
      unit: 'kg',
      stock: 50,
      image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600',
      lat: 26.4700,
      lng: 91.9500,
      village: 'Deomornoi',
      district: 'Darrang',
      haat_name: 'Deomornoi Farmer Market',
      rating: 4.9,
      status: 'active',
      is_organic: true,
    },
  ];

  const { error: listErr } = await supabaseAdmin.from('listings').insert(sampleListings);
  if (listErr) console.error('Error seeding listings:', listErr);
  else console.log(`✅ Seeded ${sampleListings.length} authentic Assamese listings`);

  console.log('🎉 Seed process finished successfully!');
}

runSeed().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
