-- Thaluwa Bazar (থলুৱা বজাৰ) Supabase PostgreSQL Schema & RLS Policies

-- Enable UUID & PostGIS extension
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- 1. USERS TABLE
create table if not exists public.users (
  id uuid default uuid_generate_v4() primary key,
  auth_id uuid references auth.users(id) on delete cascade,
  phone text unique not null,
  name text,
  email text,
  role text default 'buyer' check (role in ('buyer', 'seller', 'moderator', 'admin')),
  language text default 'en' check (language in ('en', 'as')),
  lat double precision default 26.4350,
  lng double precision default 92.0300,
  address text,
  village text,
  district text,
  verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. SELLER PROFILES
create table if not exists public.seller_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  business_name text not null,
  seller_type text default 'shg_member' check (seller_type in ('shg_member', 'individual', 'small_business')),
  shg_code text,
  village text not null,
  district text not null,
  upi_id text not null,
  bank_account text,
  bank_ifsc text,
  verification_status text default 'pending' check (verification_status in ('pending', 'verified', 'rejected', 'under_review')),
  rating numeric(3,2) default 5.0,
  reviews_count integer default 0,
  delivery_radius_km integer default 15,
  is_online boolean default true,
  id_proof_url text,
  address_proof_url text,
  shg_cert_url text,
  bank_proof_url text,
  today_sales numeric(10,2) default 0,
  total_orders integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PRODUCT CATEGORIES
create table if not exists public.categories (
  id text primary key,
  slug text unique not null,
  name_en text not null,
  name_as text not null,
  icon text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. HAAT MARKETS (Traditional Weekly Haats)
create table if not exists public.haat_markets (
  id text primary key,
  name_en text not null,
  name_as text not null,
  district text not null,
  location text not null,
  market_day text not null,
  market_day_as text not null,
  timings text not null,
  specialty_en text,
  specialty_as text,
  active_sellers_count integer default 0,
  lat double precision not null,
  lng double precision not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. LISTINGS
create table if not exists public.listings (
  id uuid default uuid_generate_v4() primary key,
  seller_id text not null,
  seller_name text not null,
  seller_type text default 'shg_member',
  seller_phone text not null,
  category_id text references public.categories(id) on delete set null,
  category_name_en text,
  category_name_as text,
  title_en text not null,
  title_as text not null,
  description_en text,
  description_as text,
  price numeric(10,2) not null,
  unit text not null,
  stock integer default 10,
  image_url text not null,
  lat double precision not null,
  lng double precision not null,
  village text not null,
  district text not null,
  haat_name text,
  rating numeric(3,2) default 4.8,
  status text default 'active' check (status in ('active', 'inactive', 'sold_out')),
  is_organic boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. ORDERS
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  order_number text unique not null,
  buyer_id text not null,
  buyer_name text not null,
  buyer_phone text not null,
  seller_id text not null,
  seller_name text not null,
  seller_phone text not null,
  subtotal numeric(10,2) not null,
  delivery_fee numeric(10,2) default 0,
  discount numeric(10,2) default 0,
  total numeric(10,2) not null,
  status text default 'REQUESTED' check (status in ('REQUESTED', 'ACCEPTED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED')),
  pickup_or_delivery text default 'delivery' check (pickup_or_delivery in ('delivery', 'pickup')),
  delivery_address text,
  payment_method text default 'cod' check (payment_method in ('upi', 'card', 'cod', 'netbanking')),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  estimated_delivery text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. ORDER ITEMS
create table if not exists public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete set null,
  title text not null,
  quantity integer not null default 1,
  unit_price numeric(10,2) not null,
  unit text not null,
  line_total numeric(10,2) not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. CONTACT UNLOCKS AUDIT (Masked Call Privacy)
create table if not exists public.contact_unlocks (
  id uuid default uuid_generate_v4() primary key,
  buyer_id text not null,
  seller_id text not null,
  listing_id text not null,
  payment_status text default 'free_tier',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table public.users enable row level security;
alter table public.seller_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.haat_markets enable row level security;
alter table public.listings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.contact_unlocks enable row level security;

-- Public read access for categories, haats, and active listings
create policy "Allow public read on categories" on public.categories for select using (true);
create policy "Allow public read on haats" on public.haat_markets for select using (true);
create policy "Allow public read on listings" on public.listings for select using (true);
create policy "Allow public insert on listings" on public.listings for insert with check (true);
create policy "Allow update on listings" on public.listings for update using (true);

-- Users & Seller profiles
create policy "Allow read on users" on public.users for select using (true);
create policy "Allow insert on users" on public.users for insert with check (true);
create policy "Allow update on users" on public.users for update using (true);

create policy "Allow read on seller_profiles" on public.seller_profiles for select using (true);
create policy "Allow insert on seller_profiles" on public.seller_profiles for insert with check (true);
create policy "Allow update on seller_profiles" on public.seller_profiles for update using (true);

-- Orders & Items
create policy "Allow read on orders" on public.orders for select using (true);
create policy "Allow insert on orders" on public.orders for insert with check (true);
create policy "Allow update on orders" on public.orders for update using (true);

create policy "Allow read on order_items" on public.order_items for select using (true);
create policy "Allow insert on order_items" on public.order_items for insert with check (true);

-- Contact Unlocks
create policy "Allow read on contact_unlocks" on public.contact_unlocks for select using (true);
create policy "Allow insert on contact_unlocks" on public.contact_unlocks for insert with check (true);

-- Storage buckets setup (run in Supabase SQL editor)
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('seller-documents', 'seller-documents', true) on conflict do nothing;

create policy "Allow public read product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "Allow authenticated upload product images" on storage.objects for insert with check (bucket_id = 'product-images');
create policy "Allow public read seller documents" on storage.objects for select using (bucket_id = 'seller-documents');
create policy "Allow authenticated upload seller documents" on storage.objects for insert with check (bucket_id = 'seller-documents');

-- SEED CATEGORIES
insert into public.categories (id, slug, name_en, name_as, icon) values
  ('c1', 'vegetables', 'Organic Vegetables', 'জৈৱিক শাক-পাচলি', 'leaf-outline'),
  ('c2', 'dairy', 'Local Dairy & Ghee', 'গাখীৰ আৰু ঘিউ', 'water-outline'),
  ('c3', 'handloom', 'Assam Handloom & Eri/Muga', 'এৰী-মুগা কাপোৰ', 'shirt-outline'),
  ('c4', 'honey_spices', 'Wild Honey & Spices', 'মৌ আৰু মচলা', 'flask-outline'),
  ('c5', 'bamboo_craft', 'Bamboo & Cane Craft', 'বাঁহ-বেতৰ শিল্প', 'hammer-outline'),
  ('c6', 'rice_grains', 'Johar Rice & Grains', 'জহা চাউল আৰু শস্য', 'grid-outline'),
  ('c7', 'fish_poultry', 'Local Fish & Poultry', 'লোকেল মাছ আৰু হাঁহ-কুকুৰা', 'fish-outline')
on conflict (id) do update set
  slug = excluded.slug,
  name_en = excluded.name_en,
  name_as = excluded.name_as,
  icon = excluded.icon;

-- SEED HAATS
insert into public.haat_markets (id, name_en, name_as, district, location, market_day, market_day_as, timings, specialty_en, specialty_as, active_sellers_count, lat, lng, image_url) values
  ('h1', 'Kharupetia Bi-Weekly Haat', 'খাৰুপেটীয়া সাপ্তাহিক বজাৰ', 'Darrang', 'Kharupetia Town Center', 'Wednesday & Saturday', 'বুধবাৰ আৰু শনিবাৰ', '6:00 AM - 2:00 PM', 'Fresh river vegetables, organic ginger, wholesale produce', 'শাক-পাচলি, জৈৱিক আদা, পাইকাৰী বজাৰ', 120, 26.5167, 92.1333, 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600'),
  ('h2', 'Mangaldai Daily Bazaar', 'মঙলদৈ দৈনিক বজাৰ', 'Darrang', 'Near Clock Tower, Mangaldai', 'Daily (Mon - Sun)', 'দৈনিক', '7:00 AM - 8:00 PM', 'Local dairy, Joha rice, mustard oil, handloom gamusa', 'লোকেল গাখীৰ, জহা চাউল, মিঠাতেল, গামোচা', 85, 26.4350, 92.0300, 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600'),
  ('h3', 'Sipajhar Friday Haat', 'ছিপাহীঝাৰ শুকুৰবৰীয়া বজাৰ', 'Darrang', 'NH-15 Sipajhar Chowk', 'Friday', 'শুকুৰবাৰ', '6:30 AM - 1:00 PM', 'Bamboo handicrafts, Eri silk weaving, village poultry', 'বাঁহৰ সাজ-সঁজুলি, এৰী সূতাৰ কাপোৰ, দেশী হাঁহ-কুকুৰা', 64, 26.3900, 91.9000, 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600'),
  ('h4', 'Deomornoi Farmer Market', 'দেওমৰনৈ কৃষক বজাৰ', 'Darrang', 'Deomornoi Higher Secondary Field', 'Sunday', 'দেওবাৰ', '5:30 AM - 12:30 PM', 'Direct farm produce, winter greens, mustard honey', 'পথাৰৰ শাক-পাচলি, লফা-লাই শাক, সৰিয়হ মৌ', 42, 26.4700, 91.9500, 'https://images.unsplash.com/photo-1506484381205-f7945653044d?w=600')
on conflict (id) do nothing;
