-- OKDX.Merch schema. Run in the Supabase SQL editor.

-- =========================
-- PRODUCTS
-- =========================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  category text not null,
  name text not null,
  price numeric not null,
  sale_price numeric,
  sizes text[] not null default '{}',
  images text[] not null default '{}',
  description text not null default '',
  variant_label text,
  variants text[]
);

grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;

alter table public.products enable row level security;
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products for select to anon using (true);
drop policy if exists "products_auth_all" on public.products;
create policy "products_auth_all" on public.products for all to authenticated using (true) with check (true);

-- =========================
-- ORDERS
-- =========================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_name text not null,
  client_contact text not null,
  items jsonb not null default '[]'::jsonb,
  total_price numeric not null default 0,
  status text not null default 'Новый',
  packaging text,
  promo_code text
);

-- If table already existed with old columns, drop deprecated ones and add new ones.
alter table public.orders drop column if exists delivery_address;
alter table public.orders add column if not exists packaging text;
alter table public.orders add column if not exists promo_code text;

grant insert on public.orders to anon;
grant select, insert, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;

alter table public.orders enable row level security;
drop policy if exists "orders_anon_insert" on public.orders;
create policy "orders_anon_insert" on public.orders for insert to anon with check (true);
drop policy if exists "orders_auth_all" on public.orders;
create policy "orders_auth_all" on public.orders for all to authenticated using (true) with check (true);

-- =========================
-- PROMO CODES
-- =========================
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  code text not null unique,
  is_active boolean not null default true,
  discount_type text not null default 'sale_price',
  discount_percent numeric
);

alter table public.promo_codes add column if not exists discount_type text not null default 'sale_price';
alter table public.promo_codes add column if not exists discount_percent numeric;

grant select on public.promo_codes to anon;
grant select, insert, update, delete on public.promo_codes to authenticated;
grant all on public.promo_codes to service_role;

alter table public.promo_codes enable row level security;
drop policy if exists "promo_public_read_active" on public.promo_codes;
create policy "promo_public_read_active" on public.promo_codes for select to anon using (is_active);
drop policy if exists "promo_auth_all" on public.promo_codes;
create policy "promo_auth_all" on public.promo_codes for all to authenticated using (true) with check (true);

-- =========================
-- APP SETTINGS
-- =========================
create table if not exists public.app_settings (
  key text primary key,
  value text
);

grant select on public.app_settings to anon;
grant select, insert, update, delete on public.app_settings to authenticated;
grant all on public.app_settings to service_role;

alter table public.app_settings enable row level security;
drop policy if exists "settings_public_read" on public.app_settings;
create policy "settings_public_read" on public.app_settings for select to anon using (true);
drop policy if exists "settings_auth_all" on public.app_settings;
create policy "settings_auth_all" on public.app_settings for all to authenticated using (true) with check (true);

insert into public.app_settings (key, value) values ('preorder_closed', 'false')
on conflict (key) do nothing;

-- =========================
-- REALTIME
-- =========================
do $$ begin
  perform 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products';
  if not found then alter publication supabase_realtime add table public.products; end if;
  perform 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders';
  if not found then alter publication supabase_realtime add table public.orders; end if;
  perform 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'promo_codes';
  if not found then alter publication supabase_realtime add table public.promo_codes; end if;
  perform 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_settings';
  if not found then alter publication supabase_realtime add table public.app_settings; end if;
end $$;
