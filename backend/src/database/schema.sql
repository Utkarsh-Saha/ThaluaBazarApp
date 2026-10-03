-- ==========================================================
-- Thaluwa Bazar (থলুৱা বজাৰ) — Full PostgreSQL + PostGIS Schema
-- ==========================================================

-- Enable Extensions
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
  expo_push_token text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table if exists public.users add column if not exists auth_id uuid references auth.users(id) on delete cascade;
alter table if exists public.users add column if not exists phone text;
alter table if exists public.users add column if not exists name text;
alter table if exists public.users add column if not exists email text;
alter table if exists public.users add column if not exists role text default 'buyer';
alter table if exists public.users add column if not exists language text default 'en';
alter table if exists public.users add column if not exists lat double precision default 26.4350;
alter table if exists public.users add column if not exists lng double precision default 92.0300;
alter table if exists public.users add column if not exists address text;
alter table if exists public.users add column if not exists village text;
alter table if exists public.users add column if not exists district text;
alter table if exists public.users add column if not exists verified boolean default false;
alter table if exists public.users add column if not exists expo_push_token text;
alter table if exists public.users add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 2. SELLER PROFILES TABLE
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

alter table if exists public.seller_profiles add column if not exists business_name text;
alter table if exists public.seller_profiles add column if not exists seller_type text default 'shg_member';
alter table if exists public.seller_profiles add column if not exists shg_code text;
alter table if exists public.seller_profiles add column if not exists village text;
alter table if exists public.seller_profiles add column if not exists district text;
alter table if exists public.seller_profiles add column if not exists upi_id text;
alter table if exists public.seller_profiles add column if not exists bank_account text;
alter table if exists public.seller_profiles add column if not exists bank_ifsc text;
alter table if exists public.seller_profiles add column if not exists verification_status text default 'pending';
alter table if exists public.seller_profiles add column if not exists rating numeric(3,2) default 5.0;
alter table if exists public.seller_profiles add column if not exists reviews_count integer default 0;
alter table if exists public.seller_profiles add column if not exists delivery_radius_km integer default 15;
alter table if exists public.seller_profiles add column if not exists is_online boolean default true;
alter table if exists public.seller_profiles add column if not exists id_proof_url text;
alter table if exists public.seller_profiles add column if not exists address_proof_url text;
alter table if exists public.seller_profiles add column if not exists shg_cert_url text;
alter table if exists public.seller_profiles add column if not exists bank_proof_url text;
alter table if exists public.seller_profiles add column if not exists today_sales numeric(10,2) default 0;
alter table if exists public.seller_profiles add column if not exists total_orders integer default 0;
alter table if exists public.seller_profiles add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 3. PRODUCT CATEGORIES TABLE
create table if not exists public.categories (
  id text primary key,
  slug text unique not null,
  name_en text not null,
  name_as text not null,
  icon text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table if exists public.categories add column if not exists slug text;
alter table if exists public.categories add column if not exists name_en text;
alter table if exists public.categories add column if not exists name_as text;
alter table if exists public.categories add column if not exists icon text;
alter table if exists public.categories add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 4. HAAT MARKETS TABLE
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

alter table if exists public.haat_markets add column if not exists name_en text;
alter table if exists public.haat_markets add column if not exists name_as text;
alter table if exists public.haat_markets add column if not exists district text;
alter table if exists public.haat_markets add column if not exists location text;
alter table if exists public.haat_markets add column if not exists market_day text;
alter table if exists public.haat_markets add column if not exists market_day_as text;
alter table if exists public.haat_markets add column if not exists timings text;
alter table if exists public.haat_markets add column if not exists specialty_en text;
alter table if exists public.haat_markets add column if not exists specialty_as text;
alter table if exists public.haat_markets add column if not exists active_sellers_count integer default 0;
alter table if exists public.haat_markets add column if not exists lat double precision;
alter table if exists public.haat_markets add column if not exists lng double precision;
alter table if exists public.haat_markets add column if not exists image_url text;
alter table if exists public.haat_markets add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 5. LISTINGS TABLE
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

alter table if exists public.listings drop constraint if exists listings_seller_id_fkey;
alter table if exists public.listings add column if not exists seller_id text;
alter table if exists public.listings add column if not exists seller_name text;
alter table if exists public.listings add column if not exists seller_type text default 'shg_member';
alter table if exists public.listings add column if not exists seller_phone text;
alter table if exists public.listings add column if not exists category_id text references public.categories(id) on delete set null;
alter table if exists public.listings add column if not exists category_name_en text;
alter table if exists public.listings add column if not exists category_name_as text;
alter table if exists public.listings add column if not exists title_en text;
alter table if exists public.listings add column if not exists title_as text;
alter table if exists public.listings add column if not exists description_en text;
alter table if exists public.listings add column if not exists description_as text;
alter table if exists public.listings add column if not exists price numeric(10,2);
alter table if exists public.listings add column if not exists unit text;
alter table if exists public.listings add column if not exists stock integer default 10;
alter table if exists public.listings add column if not exists image_url text;
alter table if exists public.listings add column if not exists lat double precision;
alter table if exists public.listings add column if not exists lng double precision;
alter table if exists public.listings add column if not exists village text;
alter table if exists public.listings add column if not exists district text;
alter table if exists public.listings add column if not exists haat_name text;
alter table if exists public.listings add column if not exists rating numeric(3,2) default 4.8;
alter table if exists public.listings add column if not exists status text default 'active';
alter table if exists public.listings add column if not exists is_organic boolean default true;
alter table if exists public.listings add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 6. ORDERS TABLE
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

alter table if exists public.orders add column if not exists order_number text;
alter table if exists public.orders add column if not exists buyer_id text;
alter table if exists public.orders add column if not exists buyer_name text;
alter table if exists public.orders add column if not exists buyer_phone text;
alter table if exists public.orders add column if not exists seller_id text;
alter table if exists public.orders add column if not exists seller_name text;
alter table if exists public.orders add column if not exists seller_phone text;
alter table if exists public.orders add column if not exists subtotal numeric(10,2);
alter table if exists public.orders add column if not exists delivery_fee numeric(10,2) default 0;
alter table if exists public.orders add column if not exists discount numeric(10,2) default 0;
alter table if exists public.orders add column if not exists total numeric(10,2);
alter table if exists public.orders add column if not exists status text default 'REQUESTED';
alter table if exists public.orders add column if not exists pickup_or_delivery text default 'delivery';
alter table if exists public.orders add column if not exists delivery_address text;
alter table if exists public.orders add column if not exists payment_method text default 'cod';
alter table if exists public.orders add column if not exists payment_status text default 'pending';
alter table if exists public.orders add column if not exists estimated_delivery text;
alter table if exists public.orders add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 7. ORDER ITEMS TABLE
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

alter table if exists public.order_items add column if not exists order_id uuid references public.orders(id) on delete cascade;
alter table if exists public.order_items add column if not exists listing_id uuid references public.listings(id) on delete set null;
alter table if exists public.order_items add column if not exists title text;
alter table if exists public.order_items add column if not exists quantity integer default 1;
alter table if exists public.order_items add column if not exists unit_price numeric(10,2);
alter table if exists public.order_items add column if not exists unit text;
alter table if exists public.order_items add column if not exists line_total numeric(10,2);
alter table if exists public.order_items add column if not exists image_url text;
alter table if exists public.order_items add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 8. REVIEWS & RATINGS TABLE
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  seller_id text not null,
  buyer_id text not null,
  buyer_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table if exists public.reviews add column if not exists order_id uuid references public.orders(id) on delete cascade;
alter table if exists public.reviews add column if not exists listing_id uuid references public.listings(id) on delete set null;
alter table if exists public.reviews add column if not exists seller_id text;
alter table if exists public.reviews add column if not exists buyer_id text;
alter table if exists public.reviews add column if not exists buyer_name text;
alter table if exists public.reviews add column if not exists rating integer;
alter table if exists public.reviews add column if not exists comment text;
alter table if exists public.reviews add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 9. IN-APP NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  title_en text not null,
  title_as text not null,
  body_en text not null,
  body_as text not null,
  type text default 'order_update' check (type in ('order_update', 'seller_status', 'haat_alert', 'promotional', 'system')),
  data jsonb default '{}'::jsonb,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table if exists public.notifications add column if not exists user_id text;
alter table if exists public.notifications add column if not exists title_en text;
alter table if exists public.notifications add column if not exists title_as text;
alter table if exists public.notifications add column if not exists body_en text;
alter table if exists public.notifications add column if not exists body_as text;
alter table if exists public.notifications add column if not exists type text default 'order_update';
alter table if exists public.notifications add column if not exists data jsonb default '{}'::jsonb;
alter table if exists public.notifications add column if not exists is_read boolean default false;
alter table if exists public.notifications add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 10. SELLER PAYOUTS TABLE
create table if not exists public.seller_payouts (
  id uuid default uuid_generate_v4() primary key,
  seller_id text not null,
  amount numeric(10,2) not null,
  upi_id text not null,
  status text default 'pending' check (status in ('pending', 'processed', 'failed')),
  reference_no text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table if exists public.seller_payouts add column if not exists seller_id text;
alter table if exists public.seller_payouts add column if not exists amount numeric(10,2);
alter table if exists public.seller_payouts add column if not exists upi_id text;
alter table if exists public.seller_payouts add column if not exists status text default 'pending';
alter table if exists public.seller_payouts add column if not exists reference_no text;
alter table if exists public.seller_payouts add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 11. CONTACT UNLOCKS (Masked Call Privacy Audit)
create table if not exists public.contact_unlocks (
  id uuid default uuid_generate_v4() primary key,
  buyer_id text not null,
  seller_id text not null,
  listing_id text not null,
  payment_status text default 'free_tier',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table if exists public.contact_unlocks add column if not exists buyer_id text;
alter table if exists public.contact_unlocks add column if not exists seller_id text;
alter table if exists public.contact_unlocks add column if not exists listing_id text;
alter table if exists public.contact_unlocks add column if not exists payment_status text default 'free_tier';
alter table if exists public.contact_unlocks add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- ==========================================================
-- POSTGIS GEOSPATIAL SEARCH FUNCTIONS
-- ==========================================================

-- Function to find nearby active listings within a radius (km)
create or replace function get_nearby_listings(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision default 25.0,
  category_filter text default null,
  search_query text default null
)
returns table (
  id uuid,
  seller_id text,
  seller_name text,
  seller_type text,
  seller_phone text,
  category_id text,
  category_name_en text,
  category_name_as text,
  title_en text,
  title_as text,
  description_en text,
  description_as text,
  price numeric,
  unit text,
  stock integer,
  image_url text,
  lat double precision,
  lng double precision,
  village text,
  district text,
  haat_name text,
  rating numeric,
  status text,
  is_organic boolean,
  created_at timestamp with time zone,
  distance_km double precision
)
language sql stable
as $$
  select
    l.id,
    l.seller_id,
    l.seller_name,
    l.seller_type,
    l.seller_phone,
    l.category_id,
    l.category_name_en,
    l.category_name_as,
    l.title_en,
    l.title_as,
    l.description_en,
    l.description_as,
    l.price,
    l.unit,
    l.stock,
    l.image_url,
    l.lat,
    l.lng,
    l.village,
    l.district,
    l.haat_name,
    l.rating,
    l.status,
    l.is_organic,
    l.created_at,
    round(
      (st_distance(
        st_setsrid(st_makepoint(l.lng, l.lat), 4326)::geography,
        st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography
      ) / 1000.0)::numeric, 1
    )::double precision as distance_km
  from public.listings l
  where
    l.status = 'active'
    and (category_filter is null or l.category_id = category_filter)
    and (
      search_query is null
      or l.title_en ilike '%' || search_query || '%'
      or l.title_as ilike '%' || search_query || '%'
      or l.village ilike '%' || search_query || '%'
      or l.district ilike '%' || search_query || '%'
    )
    and (
      st_distance(
        st_setsrid(st_makepoint(l.lng, l.lat), 4326)::geography,
        st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography
      ) / 1000.0
    ) <= radius_km
  order by distance_km asc;
$$;

-- Function to find nearby weekly haat markets
create or replace function get_nearby_haats(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision default 50.0
)
returns table (
  id text,
  name_en text,
  name_as text,
  district text,
  location text,
  market_day text,
  market_day_as text,
  timings text,
  specialty_en text,
  specialty_as text,
  active_sellers_count integer,
  lat double precision,
  lng double precision,
  image_url text,
  created_at timestamp with time zone,
  distance_km double precision
)
language sql stable
as $$
  select
    h.id,
    h.name_en,
    h.name_as,
    h.district,
    h.location,
    h.market_day,
    h.market_day_as,
    h.timings,
    h.specialty_en,
    h.specialty_as,
    h.active_sellers_count,
    h.lat,
    h.lng,
    h.image_url,
    h.created_at,
    round(
      (st_distance(
        st_setsrid(st_makepoint(h.lng, h.lat), 4326)::geography,
        st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography
      ) / 1000.0)::numeric, 1
    )::double precision as distance_km
  from public.haat_markets h
  where (
    st_distance(
      st_setsrid(st_makepoint(h.lng, h.lat), 4326)::geography,
      st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography
    ) / 1000.0
  ) <= radius_km
  order by distance_km asc;
$$;

-- ==========================================================
-- AUTOMATIC DATABASE TRIGGERS
-- ==========================================================

-- 1. Auto-update seller rating on review insert
create or replace function update_seller_rating_on_review()
returns trigger as $$
begin
  update public.seller_profiles
  set
    rating = (
      select coalesce(round(avg(rating)::numeric, 2), 5.0)
      from public.reviews
      where seller_id = new.seller_id
    ),
    reviews_count = (
      select count(*)
      from public.reviews
      where seller_id = new.seller_id
    )
  where id::text = new.seller_id or user_id::text = new.seller_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_seller_rating on public.reviews;
create trigger trigger_update_seller_rating
after insert or update or delete on public.reviews
for each row execute function update_seller_rating_on_review();

-- 2. Auto-increment seller sales & total orders when order completes
create or replace function update_seller_stats_on_order_complete()
returns trigger as $$
begin
  if new.status = 'COMPLETED' and (old.status is null or old.status != 'COMPLETED') then
    update public.seller_profiles
    set
      today_sales = today_sales + new.total,
      total_orders = total_orders + 1
    where id::text = new.seller_id or user_id::text = new.seller_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_seller_stats on public.orders;
create trigger trigger_update_seller_stats
after update of status on public.orders
for each row execute function update_seller_stats_on_order_complete();

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (IDEMPOTENT)
-- ==========================================================
alter table public.users enable row level security;
alter table public.seller_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.haat_markets enable row level security;
alter table public.listings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.seller_payouts enable row level security;
alter table public.contact_unlocks enable row level security;

-- Drop existing policies if any
drop policy if exists "Allow public read categories" on public.categories;
drop policy if exists "Allow public read on categories" on public.categories;
drop policy if exists "Allow insert categories" on public.categories;
drop policy if exists "Allow update categories" on public.categories;
create policy "Allow public read categories" on public.categories for select using (true);
create policy "Allow insert categories" on public.categories for insert with check (true);
create policy "Allow update categories" on public.categories for update using (true);

drop policy if exists "Allow public read haats" on public.haat_markets;
drop policy if exists "Allow public read on haats" on public.haat_markets;
drop policy if exists "Allow public read on haat_markets" on public.haat_markets;
drop policy if exists "Allow insert haats" on public.haat_markets;
drop policy if exists "Allow update haats" on public.haat_markets;
create policy "Allow public read haats" on public.haat_markets for select using (true);
create policy "Allow insert haats" on public.haat_markets for insert with check (true);
create policy "Allow update haats" on public.haat_markets for update using (true);

drop policy if exists "Allow public read listings" on public.listings;
drop policy if exists "Allow public read on listings" on public.listings;
drop policy if exists "Allow public insert listings" on public.listings;
drop policy if exists "Allow insert listings" on public.listings;
drop policy if exists "Allow update listings" on public.listings;
create policy "Allow public read listings" on public.listings for select using (true);
create policy "Allow public insert listings" on public.listings for insert with check (true);
create policy "Allow update listings" on public.listings for update using (true);

drop policy if exists "Allow read users" on public.users;
drop policy if exists "Allow insert users" on public.users;
drop policy if exists "Allow update users" on public.users;
create policy "Allow read users" on public.users for select using (true);
create policy "Allow insert users" on public.users for insert with check (true);
create policy "Allow update users" on public.users for update using (true);

drop policy if exists "Allow read seller_profiles" on public.seller_profiles;
drop policy if exists "Allow insert seller_profiles" on public.seller_profiles;
drop policy if exists "Allow update seller_profiles" on public.seller_profiles;
create policy "Allow read seller_profiles" on public.seller_profiles for select using (true);
create policy "Allow insert seller_profiles" on public.seller_profiles for insert with check (true);
create policy "Allow update seller_profiles" on public.seller_profiles for update using (true);

drop policy if exists "Allow read orders" on public.orders;
drop policy if exists "Allow insert orders" on public.orders;
drop policy if exists "Allow update orders" on public.orders;
create policy "Allow read orders" on public.orders for select using (true);
create policy "Allow insert orders" on public.orders for insert with check (true);
create policy "Allow update orders" on public.orders for update using (true);

drop policy if exists "Allow read order_items" on public.order_items;
drop policy if exists "Allow insert order_items" on public.order_items;
create policy "Allow read order_items" on public.order_items for select using (true);
create policy "Allow insert order_items" on public.order_items for insert with check (true);

drop policy if exists "Allow read reviews" on public.reviews;
drop policy if exists "Allow insert reviews" on public.reviews;
create policy "Allow read reviews" on public.reviews for select using (true);
create policy "Allow insert reviews" on public.reviews for insert with check (true);

drop policy if exists "Allow read notifications" on public.notifications;
drop policy if exists "Allow insert notifications" on public.notifications;
drop policy if exists "Allow update notifications" on public.notifications;
create policy "Allow read notifications" on public.notifications for select using (true);
create policy "Allow insert notifications" on public.notifications for insert with check (true);
create policy "Allow update notifications" on public.notifications for update using (true);

drop policy if exists "Allow read payouts" on public.seller_payouts;
drop policy if exists "Allow insert payouts" on public.seller_payouts;
create policy "Allow read payouts" on public.seller_payouts for select using (true);
create policy "Allow insert payouts" on public.seller_payouts for insert with check (true);

drop policy if exists "Allow read contact_unlocks" on public.contact_unlocks;
drop policy if exists "Allow insert contact_unlocks" on public.contact_unlocks;
create policy "Allow read contact_unlocks" on public.contact_unlocks for select using (true);
create policy "Allow insert contact_unlocks" on public.contact_unlocks for insert with check (true);

-- Storage buckets
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('seller-documents', 'seller-documents', true) on conflict do nothing;

drop policy if exists "Allow public read product images" on storage.objects;
drop policy if exists "Allow authenticated upload product images" on storage.objects;
drop policy if exists "Allow public read seller documents" on storage.objects;
drop policy if exists "Allow authenticated upload seller documents" on storage.objects;
drop policy if exists "Allow upload product images" on storage.objects;
drop policy if exists "Allow upload seller documents" on storage.objects;

create policy "Allow public read product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "Allow authenticated upload product images" on storage.objects for insert with check (bucket_id = 'product-images');
create policy "Allow public read seller documents" on storage.objects for select using (bucket_id = 'seller-documents');
create policy "Allow authenticated upload seller documents" on storage.objects for insert with check (bucket_id = 'seller-documents');
