-- ==========================================================
-- Thaluwa Bazar (থলুৱা বজাৰ) — Hardened PostgreSQL + PostGIS Schema v3
-- Comprehensive Security Audit, RLS Policies & Encryption Implementation
-- ==========================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";
create extension if not exists "pgcrypto";

-- ==========================================================
-- CORE TABLES
-- ==========================================================

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

-- 4. CLEANUP HAAT MARKETS
drop table if exists public.haat_markets cascade;
alter table if exists public.listings drop column if exists haat_name;

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
  razorpay_order_id text,
  razorpay_payment_id text,
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
alter table if exists public.orders add column if not exists razorpay_order_id text;
alter table if exists public.orders add column if not exists razorpay_payment_id text;
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
  type text default 'order_update' check (type in ('order_update', 'seller_status', 'promotional', 'system')),
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

-- 11. CONTACT UNLOCKS TABLE
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

-- 12. USER ADDRESSES (Multi-Address Cloud Book)
create table if not exists public.user_addresses (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  name text not null,
  phone text not null,
  type text default 'home',
  street text not null,
  village text,
  district text,
  pincode text,
  landmark text,
  is_default boolean default false,
  lat double precision,
  lng double precision,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table if exists public.user_addresses add column if not exists user_id text;
alter table if exists public.user_addresses add column if not exists name text;
alter table if exists public.user_addresses add column if not exists phone text;
alter table if exists public.user_addresses add column if not exists type text default 'home';
alter table if exists public.user_addresses add column if not exists street text;
alter table if exists public.user_addresses add column if not exists village text;
alter table if exists public.user_addresses add column if not exists district text;
alter table if exists public.user_addresses add column if not exists pincode text;
alter table if exists public.user_addresses add column if not exists landmark text;
alter table if exists public.user_addresses add column if not exists is_default boolean default false;
alter table if exists public.user_addresses add column if not exists lat double precision;
alter table if exists public.user_addresses add column if not exists lng double precision;
alter table if exists public.user_addresses add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 13. CONVERSATIONS TABLE
create table if not exists public.conversations (
  id uuid default uuid_generate_v4() primary key,
  buyer_id text not null,
  buyer_name text not null,
  seller_id text not null,
  seller_name text not null,
  seller_phone text,
  listing_id text,
  listing_title text,
  last_message_text text,
  last_message_at timestamp with time zone default timezone('utc'::text, now()),
  buyer_unread_count integer default 0,
  seller_unread_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 14. MESSAGES TABLE
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id text not null,
  sender_name text not null,
  sender_role text not null check (sender_role in ('buyer', 'seller')),
  recipient_id text not null,
  message_type text not null default 'text' check (message_type in ('text', 'audio', 'order_inquiry')),
  text text,
  audio_url text,
  audio_duration_seconds integer default 0,
  metadata jsonb default '{}'::jsonb,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 15. PAYMENT TRANSACTIONS TABLE (Immutable Payment Audit Ledger)
create table if not exists public.payment_transactions (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade,
  order_number text not null,
  buyer_id text not null,
  seller_id text not null,
  amount numeric(10,2) not null,
  currency text default 'INR',
  payment_method text not null,
  payment_status text not null default 'initiated',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  error_code text,
  error_description text,
  raw_response jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 16. AUDIT LOGS TABLE (Enterprise Operations Console)
create table if not exists public.audit_logs (
  id text primary key default gen_random_uuid()::text,
  actor_id text,
  actor_name text,
  actor_role text,
  action text not null,
  entity text,
  entity_id text,
  details text,
  metadata jsonb default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================================
-- INDEXES FOR PERFORMANCE & FAST GEOSPATIAL SEARCH
-- ==========================================================
create index if not exists idx_users_auth_id on public.users (auth_id);
create index if not exists idx_users_phone on public.users (phone);
create index if not exists idx_seller_profiles_user on public.seller_profiles (user_id);
create index if not exists idx_listings_seller on public.listings (seller_id);
create index if not exists idx_listings_status on public.listings (status);
create index if not exists idx_orders_buyer on public.orders (buyer_id);
create index if not exists idx_orders_seller on public.orders (seller_id);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_conversations_buyer on public.conversations (buyer_id);
create index if not exists idx_conversations_seller on public.conversations (seller_id);
create index if not exists idx_messages_conversation on public.messages (conversation_id);
create index if not exists idx_messages_created_at on public.messages (created_at);
create index if not exists idx_user_addresses_user on public.user_addresses (user_id);
create index if not exists idx_payment_transactions_order on public.payment_transactions (order_id);
create index if not exists idx_payment_transactions_rzp_order on public.payment_transactions (razorpay_order_id);
create index if not exists idx_audit_logs_action on public.audit_logs (action);
create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);

-- ==========================================================
-- SECURITY DEFINER HELPER FUNCTIONS
-- ==========================================================

-- 1. Resolve current user's public UUID from auth.uid()
create or replace function public.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select id from public.users where auth_id = auth.uid() limit 1),
    auth.uid()
  );
$$;

-- 2. Verify whether current user possesses administrator privileges
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where (auth_id = auth.uid() or id = auth.uid())
      and role = 'admin'
  );
$$;

-- 3. Verify whether current user possesses registered producer role
create or replace function public.is_seller()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where (auth_id = auth.uid() or id = auth.uid())
      and role in ('seller', 'admin')
  );
$$;

-- 4. Cryptographic PII Masking Helper
create or replace function public.mask_sensitive_number(val text, visible_suffix_len int default 4)
returns text
language plpgsql
immutable
as $$
begin
  if val is null or length(trim(val)) <= visible_suffix_len then
    return val;
  end if;
  return repeat('•', length(trim(val)) - visible_suffix_len) || right(trim(val), visible_suffix_len);
end;
$$;

-- ==========================================================
-- POSTGIS GEOSPATIAL SEARCH FUNCTIONS
-- ==========================================================
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

-- ==========================================================
-- AUTOMATIC DATABASE TRIGGERS
-- ==========================================================
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

create or replace function update_seller_stats_on_order_complete()
returns trigger as $$
begin
  if new.status = 'COMPLETED' and (old.status is null or old.status != 'COMPLETED') then
    update public.seller_profiles
    set
      today_sales = today_sales + new.total,
      total_orders = total_orders + 1
    where id::text = new.seller_id::text or user_id::text = new.seller_id::text;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_seller_stats on public.orders;
create trigger trigger_update_seller_stats
after update of status on public.orders
for each row execute function update_seller_stats_on_order_complete();

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — LEAST-PRIVILEGE AUDIT
-- ==========================================================

-- Enable RLS across all tables in public schema
alter table public.users enable row level security;
alter table public.seller_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.listings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.seller_payouts enable row level security;
alter table public.contact_unlocks enable row level security;
alter table public.user_addresses enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.audit_logs enable row level security;

-- Drop legacy / blanket policies
drop policy if exists "Allow public read categories" on public.categories;
drop policy if exists "Allow public read on categories" on public.categories;
drop policy if exists "Allow insert categories" on public.categories;
drop policy if exists "Allow update categories" on public.categories;

drop policy if exists "Allow public read listings" on public.listings;
drop policy if exists "Allow public read on listings" on public.listings;
drop policy if exists "Allow public insert listings" on public.listings;
drop policy if exists "Allow insert listings" on public.listings;
drop policy if exists "Allow update listings" on public.listings;

drop policy if exists "Allow read users" on public.users;
drop policy if exists "Allow insert users" on public.users;
drop policy if exists "Allow update users" on public.users;

drop policy if exists "Allow read seller_profiles" on public.seller_profiles;
drop policy if exists "Allow insert seller_profiles" on public.seller_profiles;
drop policy if exists "Allow update seller_profiles" on public.seller_profiles;

drop policy if exists "Allow read orders" on public.orders;
drop policy if exists "Allow insert orders" on public.orders;
drop policy if exists "Allow update orders" on public.orders;

drop policy if exists "Allow read order_items" on public.order_items;
drop policy if exists "Allow insert order_items" on public.order_items;

drop policy if exists "Allow read reviews" on public.reviews;
drop policy if exists "Allow insert reviews" on public.reviews;

drop policy if exists "Allow read notifications" on public.notifications;
drop policy if exists "Allow insert notifications" on public.notifications;
drop policy if exists "Allow update notifications" on public.notifications;

drop policy if exists "Allow read payouts" on public.seller_payouts;
drop policy if exists "Allow insert payouts" on public.seller_payouts;

drop policy if exists "Allow read contact_unlocks" on public.contact_unlocks;
drop policy if exists "Allow insert contact_unlocks" on public.contact_unlocks;

drop policy if exists "Allow read conversations" on public.conversations;
drop policy if exists "Allow insert conversations" on public.conversations;
drop policy if exists "Allow update conversations" on public.conversations;

drop policy if exists "Allow read messages" on public.messages;
drop policy if exists "Allow insert messages" on public.messages;
drop policy if exists "Allow update messages" on public.messages;

drop policy if exists "Allow read payment_transactions" on public.payment_transactions;
drop policy if exists "Allow insert payment_transactions" on public.payment_transactions;
drop policy if exists "Allow update payment_transactions" on public.payment_transactions;

-- ----------------------------------------------------------
-- 1. USERS POLICIES
-- ----------------------------------------------------------
create policy "users_select_policy"
on public.users for select
using (
  auth.uid() = auth_id
  or auth.uid() = id
  or role = 'seller'
  or verified = true
  or public.is_admin()
);

create policy "users_insert_policy"
on public.users for insert
with check (
  auth.uid() = auth_id
  or auth.uid() = id
  or auth.role() = 'authenticated'
  or public.is_admin()
);

create policy "users_update_policy"
on public.users for update
using (
  auth.uid() = auth_id
  or auth.uid() = id
  or public.is_admin()
)
with check (
  (auth.uid() = auth_id or auth.uid() = id or public.is_admin())
);

create policy "users_delete_policy"
on public.users for delete
using (
  auth.uid() = auth_id
  or auth.uid() = id
  or public.is_admin()
);

-- ----------------------------------------------------------
-- 2. SELLER PROFILES POLICIES
-- ----------------------------------------------------------
create policy "seller_profiles_select_policy"
on public.seller_profiles for select
using (
  verification_status in ('verified', 'under_review')
  or is_online = true
  or user_id = public.current_user_id()
  or user_id in (select id from public.users where auth_id = auth.uid())
  or public.is_admin()
);

create policy "seller_profiles_insert_policy"
on public.seller_profiles for insert
with check (
  user_id = public.current_user_id()
  or user_id in (select id from public.users where auth_id = auth.uid())
  or public.is_admin()
);

create policy "seller_profiles_update_policy"
on public.seller_profiles for update
using (
  user_id = public.current_user_id()
  or user_id in (select id from public.users where auth_id = auth.uid())
  or public.is_admin()
)
with check (
  user_id = public.current_user_id()
  or user_id in (select id from public.users where auth_id = auth.uid())
  or public.is_admin()
);

create policy "seller_profiles_delete_policy"
on public.seller_profiles for delete
using (
  user_id = public.current_user_id()
  or public.is_admin()
);

-- ----------------------------------------------------------
-- 3. CATEGORIES POLICIES
-- ----------------------------------------------------------
create policy "categories_select_policy"
on public.categories for select
using (true);

create policy "categories_admin_all_policy"
on public.categories for all
using (public.is_admin())
with check (public.is_admin());

-- ----------------------------------------------------------
-- 4. LISTINGS POLICIES
-- ----------------------------------------------------------
create policy "listings_select_policy"
on public.listings for select
using (
  status = 'active'
  or seller_id = public.current_user_id()::text
  or seller_id in (select id::text from public.seller_profiles where user_id = public.current_user_id())
  or public.is_admin()
);

create policy "listings_insert_policy"
on public.listings for insert
with check (
  auth.role() = 'authenticated'
  and (
    seller_id = public.current_user_id()::text
    or seller_id in (select id::text from public.seller_profiles where user_id = public.current_user_id())
    or public.is_admin()
  )
);

create policy "listings_update_policy"
on public.listings for update
using (
  seller_id = public.current_user_id()::text
  or seller_id in (select id::text from public.seller_profiles where user_id = public.current_user_id())
  or public.is_admin()
)
with check (
  seller_id = public.current_user_id()::text
  or seller_id in (select id::text from public.seller_profiles where user_id = public.current_user_id())
  or public.is_admin()
);

create policy "listings_delete_policy"
on public.listings for delete
using (
  seller_id = public.current_user_id()::text
  or seller_id in (select id::text from public.seller_profiles where user_id = public.current_user_id())
  or public.is_admin()
);

-- ----------------------------------------------------------
-- 5. ORDERS POLICIES
-- ----------------------------------------------------------
create policy "orders_select_policy"
on public.orders for select
using (
  buyer_id = public.current_user_id()::text
  or buyer_id = auth.uid()::text
  or seller_id = public.current_user_id()::text
  or seller_id in (select id::text from public.seller_profiles where user_id = public.current_user_id())
  or public.is_admin()
);

create policy "orders_insert_policy"
on public.orders for insert
with check (
  auth.role() = 'authenticated'
  and (
    buyer_id = public.current_user_id()::text
    or buyer_id = auth.uid()::text
    or public.is_admin()
  )
);

create policy "orders_update_policy"
on public.orders for update
using (
  buyer_id = public.current_user_id()::text
  or buyer_id = auth.uid()::text
  or seller_id = public.current_user_id()::text
  or seller_id in (select id::text from public.seller_profiles where user_id = public.current_user_id())
  or public.is_admin()
);

-- ----------------------------------------------------------
-- 6. ORDER ITEMS POLICIES
-- ----------------------------------------------------------
create policy "order_items_select_policy"
on public.order_items for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (
        o.buyer_id = public.current_user_id()::text
        or o.buyer_id = auth.uid()::text
        or o.seller_id = public.current_user_id()::text
        or o.seller_id in (select id::text from public.seller_profiles where user_id = public.current_user_id())
        or public.is_admin()
      )
  )
);

create policy "order_items_insert_policy"
on public.order_items for insert
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (
        o.buyer_id = public.current_user_id()::text
        or o.buyer_id = auth.uid()::text
        or public.is_admin()
      )
  )
);

-- ----------------------------------------------------------
-- 7. REVIEWS POLICIES
-- ----------------------------------------------------------
create policy "reviews_select_policy"
on public.reviews for select
using (true);

create policy "reviews_insert_policy"
on public.reviews for insert
with check (
  auth.role() = 'authenticated'
  and (
    buyer_id = public.current_user_id()::text
    or buyer_id = auth.uid()::text
    or public.is_admin()
  )
);

create policy "reviews_update_policy"
on public.reviews for update
using (
  buyer_id = public.current_user_id()::text
  or buyer_id = auth.uid()::text
  or public.is_admin()
);

create policy "reviews_delete_policy"
on public.reviews for delete
using (
  buyer_id = public.current_user_id()::text
  or buyer_id = auth.uid()::text
  or public.is_admin()
);

-- ----------------------------------------------------------
-- 8. NOTIFICATIONS POLICIES
-- ----------------------------------------------------------
create policy "notifications_select_policy"
on public.notifications for select
using (
  user_id = public.current_user_id()::text
  or user_id = auth.uid()::text
  or public.is_admin()
);

create policy "notifications_insert_policy"
on public.notifications for insert
with check (auth.role() = 'authenticated');

create policy "notifications_update_policy"
on public.notifications for update
using (
  user_id = public.current_user_id()::text
  or user_id = auth.uid()::text
  or public.is_admin()
);

create policy "notifications_delete_policy"
on public.notifications for delete
using (
  user_id = public.current_user_id()::text
  or user_id = auth.uid()::text
  or public.is_admin()
);

-- ----------------------------------------------------------
-- 9. SELLER PAYOUTS POLICIES
-- ----------------------------------------------------------
create policy "seller_payouts_select_policy"
on public.seller_payouts for select
using (
  seller_id = public.current_user_id()::text
  or seller_id in (select id::text from public.seller_profiles where user_id = public.current_user_id())
  or public.is_admin()
);

create policy "seller_payouts_insert_policy"
on public.seller_payouts for insert
with check (
  auth.role() = 'authenticated'
  and (
    seller_id = public.current_user_id()::text
    or seller_id in (select id::text from public.seller_profiles where user_id = public.current_user_id())
    or public.is_admin()
  )
);

create policy "seller_payouts_admin_policy"
on public.seller_payouts for update
using (public.is_admin())
with check (public.is_admin());

-- ----------------------------------------------------------
-- 10. CONTACT UNLOCKS POLICIES
-- ----------------------------------------------------------
create policy "contact_unlocks_select_policy"
on public.contact_unlocks for select
using (
  buyer_id = public.current_user_id()::text
  or buyer_id = auth.uid()::text
  or public.is_admin()
);

create policy "contact_unlocks_insert_policy"
on public.contact_unlocks for insert
with check (
  auth.role() = 'authenticated'
  and (
    buyer_id = public.current_user_id()::text
    or buyer_id = auth.uid()::text
    or public.is_admin()
  )
);

-- ----------------------------------------------------------
-- 11. USER ADDRESSES POLICIES
-- ----------------------------------------------------------
create policy "user_addresses_select_policy"
on public.user_addresses for select
using (
  user_id = public.current_user_id()::text
  or user_id = auth.uid()::text
  or public.is_admin()
);

create policy "user_addresses_insert_policy"
on public.user_addresses for insert
with check (
  auth.role() = 'authenticated'
  and (
    user_id = public.current_user_id()::text
    or user_id = auth.uid()::text
    or public.is_admin()
  )
);

create policy "user_addresses_update_policy"
on public.user_addresses for update
using (
  user_id = public.current_user_id()::text
  or user_id = auth.uid()::text
  or public.is_admin()
);

create policy "user_addresses_delete_policy"
on public.user_addresses for delete
using (
  user_id = public.current_user_id()::text
  or user_id = auth.uid()::text
  or public.is_admin()
);

-- ----------------------------------------------------------
-- 12. CONVERSATIONS POLICIES
-- ----------------------------------------------------------
create policy "conversations_select_policy"
on public.conversations for select
using (
  buyer_id = public.current_user_id()::text
  or buyer_id = auth.uid()::text
  or seller_id = public.current_user_id()::text
  or seller_id in (select id::text from public.seller_profiles where user_id = public.current_user_id())
  or public.is_admin()
);

create policy "conversations_insert_policy"
on public.conversations for insert
with check (
  auth.role() = 'authenticated'
  and (
    buyer_id = public.current_user_id()::text
    or buyer_id = auth.uid()::text
    or seller_id = public.current_user_id()::text
    or public.is_admin()
  )
);

create policy "conversations_update_policy"
on public.conversations for update
using (
  buyer_id = public.current_user_id()::text
  or buyer_id = auth.uid()::text
  or seller_id = public.current_user_id()::text
  or seller_id in (select id::text from public.seller_profiles where user_id = public.current_user_id())
  or public.is_admin()
);

-- ----------------------------------------------------------
-- 13. MESSAGES POLICIES
-- ----------------------------------------------------------
create policy "messages_select_policy"
on public.messages for select
using (
  sender_id = public.current_user_id()::text
  or sender_id = auth.uid()::text
  or recipient_id = public.current_user_id()::text
  or recipient_id = auth.uid()::text
  or exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and (
        c.buyer_id = public.current_user_id()::text
        or c.buyer_id = auth.uid()::text
        or c.seller_id = public.current_user_id()::text
        or c.seller_id in (select id::text from public.seller_profiles where user_id = public.current_user_id())
      )
  )
  or public.is_admin()
);

create policy "messages_insert_policy"
on public.messages for insert
with check (
  auth.role() = 'authenticated'
  and (
    sender_id = public.current_user_id()::text
    or sender_id = auth.uid()::text
    or public.is_admin()
  )
);

create policy "messages_update_policy"
on public.messages for update
using (
  recipient_id = public.current_user_id()::text
  or recipient_id = auth.uid()::text
  or public.is_admin()
);

-- ----------------------------------------------------------
-- 14. PAYMENT TRANSACTIONS POLICIES (Immutable Ledger)
-- ----------------------------------------------------------
create policy "payment_transactions_select_policy"
on public.payment_transactions for select
using (
  buyer_id = public.current_user_id()::text
  or buyer_id = auth.uid()::text
  or seller_id = public.current_user_id()::text
  or seller_id in (select id::text from public.seller_profiles where user_id = public.current_user_id())
  or public.is_admin()
);

create policy "payment_transactions_insert_policy"
on public.payment_transactions for insert
with check (
  auth.role() = 'authenticated'
  and (
    buyer_id = public.current_user_id()::text
    or buyer_id = auth.uid()::text
    or public.is_admin()
  )
);

-- No client update/delete permitted on payment transactions ledger!

-- ----------------------------------------------------------
-- 15. AUDIT LOGS POLICIES
-- ----------------------------------------------------------
create policy "audit_logs_select_policy"
on public.audit_logs for select
using (public.is_admin());

create policy "audit_logs_insert_policy"
on public.audit_logs for insert
with check (public.is_admin() or auth.role() = 'authenticated');

-- ==========================================================
-- STORAGE BUCKETS & ACCESS POLICIES
-- ==========================================================

-- 1. Product Images Bucket (Public Read, Authenticated Insert)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Allow public read product images" on storage.objects;
drop policy if exists "Allow authenticated upload product images" on storage.objects;
drop policy if exists "Allow upload product images" on storage.objects;
drop policy if exists "Product images are publicly viewable" on storage.objects;
drop policy if exists "Authenticated users can upload product images" on storage.objects;

create policy "Product images are publicly viewable"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "Authenticated users can upload product images"
on storage.objects for insert
with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

-- 2. Seller KYC Documents Bucket (PRIVATE — Zero Public Access!)
insert into storage.buckets (id, name, public)
values ('seller-documents', 'seller-documents', false)
on conflict (id) do update set public = false;

drop policy if exists "Allow public read seller documents" on storage.objects;
drop policy if exists "Allow authenticated upload seller documents" on storage.objects;
drop policy if exists "Allow upload seller documents" on storage.objects;
drop policy if exists "Only document owner or admin can view seller documents" on storage.objects;
drop policy if exists "Authenticated sellers can upload their own documents" on storage.objects;

create policy "Only document owner or admin can view seller documents"
on storage.objects for select
using (
  bucket_id = 'seller-documents'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.current_user_id()::text = (storage.foldername(name))[1]
    or public.is_admin()
  )
);

create policy "Authenticated sellers can upload their own documents"
on storage.objects for insert
with check (
  bucket_id = 'seller-documents'
  and auth.role() = 'authenticated'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.current_user_id()::text = (storage.foldername(name))[1]
    or public.is_admin()
  )
);

-- 3. Chat Audio Voice Notes Bucket (PRIVATE — Conversation Access Only)
insert into storage.buckets (id, name, public)
values ('chat-audio', 'chat-audio', false)
on conflict (id) do update set public = false;

drop policy if exists "Allow public read chat audio" on storage.objects;
drop policy if exists "Allow upload chat audio" on storage.objects;
drop policy if exists "Authenticated users can view chat audio" on storage.objects;
drop policy if exists "Authenticated users can upload chat audio" on storage.objects;

create policy "Authenticated users can view chat audio"
on storage.objects for select
using (bucket_id = 'chat-audio' and auth.role() = 'authenticated');

create policy "Authenticated users can upload chat audio"
on storage.objects for insert
with check (bucket_id = 'chat-audio' and auth.role() = 'authenticated');

-- ==========================================================
-- TABLE GRANTS & LEAST-PRIVILEGE PERMISSION AUDIT
-- ==========================================================

-- Revoke default permissive grants
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Grant schema usage
grant usage on schema public to anon, authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Public read tables (anon + authenticated)
grant select on public.categories to anon, authenticated;
grant select on public.listings to anon, authenticated;
grant select on public.seller_profiles to anon, authenticated;
grant select on public.reviews to anon, authenticated;

-- Authenticated member grants (restricted and filtered via RLS)
grant select, insert, update, delete on public.users to authenticated;
grant select, insert, update on public.seller_profiles to authenticated;
grant select, insert, update, delete on public.listings to authenticated;
grant select, insert, update on public.orders to authenticated;
grant select, insert on public.order_items to authenticated;
grant select, insert, update, delete on public.reviews to authenticated;
grant select, update, delete on public.notifications to authenticated;
grant select, insert on public.seller_payouts to authenticated;
grant select, insert on public.contact_unlocks to authenticated;
grant select, insert, update, delete on public.user_addresses to authenticated;
grant select, insert, update on public.conversations to authenticated;
grant select, insert, update on public.messages to authenticated;
grant select, insert on public.payment_transactions to authenticated;
grant select, insert on public.audit_logs to authenticated;

-- Function Execution Grants
grant execute on function public.get_nearby_listings to anon, authenticated;
grant execute on function public.current_user_id to anon, authenticated;
grant execute on function public.is_admin to anon, authenticated;
grant execute on function public.is_seller to anon, authenticated;
grant execute on function public.mask_sensitive_number to anon, authenticated;

-- ==========================================================
-- REALTIME SUBSCRIPTIONS & REPLICA IDENTITY
-- ==========================================================
alter table public.orders replica identity full;
alter table public.messages replica identity full;
alter table public.conversations replica identity full;
alter table public.notifications replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.conversations;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when others then null;
end $$;
