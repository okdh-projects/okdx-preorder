-- OKDX.Merch schema
-- Run this in the Supabase SQL editor once to set up the database.

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

drop policy if exists "products_auth_read" on public.products;
create policy "products_auth_read" on public.products for select to authenticated using (true);

drop policy if exists "products_auth_write" on public.products;
create policy "products_auth_write" on public.products for all to authenticated using (true) with check (true);

-- =========================
-- ORDERS
-- =========================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_name text not null,
  client_contact text not null,
  delivery_address text,
  items jsonb not null default '[]'::jsonb,
  total_price numeric not null default 0,
  status text not null default 'Новый'
);

grant insert on public.orders to anon;
grant select, insert, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;

alter table public.orders enable row level security;

-- Anonymous customers can create orders
drop policy if exists "orders_anon_insert" on public.orders;
create policy "orders_anon_insert" on public.orders for insert to anon with check (true);

-- Admins (any authenticated user) can read/update/delete
drop policy if exists "orders_auth_all" on public.orders;
create policy "orders_auth_all" on public.orders for all to authenticated using (true) with check (true);

-- =========================
-- PROMO CODES
-- =========================
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  code text not null unique,
  is_active boolean not null default true
);

grant select on public.promo_codes to anon;
grant select, insert, update, delete on public.promo_codes to authenticated;
grant all on public.promo_codes to service_role;

alter table public.promo_codes enable row level security;

drop policy if exists "promo_public_read_active" on public.promo_codes;
create policy "promo_public_read_active" on public.promo_codes for select to anon using (is_active);

drop policy if exists "promo_auth_all" on public.promo_codes;
create policy "promo_auth_all" on public.promo_codes for all to authenticated using (true) with check (true);

-- =========================
-- APP SETTINGS (preorder_closed flag, etc.)
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

insert into public.app_settings (key, value)
values ('preorder_closed', 'false')
on conflict (key) do nothing;

-- =========================
-- REALTIME
-- =========================
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.promo_codes;
alter publication supabase_realtime add table public.app_settings;

-- =========================
-- SEED PRODUCTS (only if table is empty)
-- =========================
insert into public.products (category, name, price, sizes, images, description, variant_label, variants)
select * from (values
  ('Футболки','Футболка VOID',1490,array['XS','S','M','L','XL','XXL']::text[],array['./images/tshirt-void.jpg']::text[],'Оверсайз-крой из 100% хлопка 240 г/м². Шелкография на груди.',null::text,null::text[]),
  ('Футболки','Футболка STATIC',1290,array['S','M','L','XL']::text[],array['./images/tshirt-static.jpg']::text[],'Классический крой, плотный хлопок, минималистичный принт.',null::text,null::text[]),
  ('Худи','Худи SIGNAL',3490,array['S','M','L','XL','XXL']::text[],array['./images/hoodie-signal.jpg']::text[],'Худи из плотного футера с начёсом. Прямой крой.',null::text,null::text[]),
  ('Кружки','Кружка TRANSMISSION',690,array[]::text[],array['./images/mug-transmission.jpg']::text[],'Керамическая кружка с матовой печатью.','Объём',array['330 мл']::text[]),
  ('Кружки','Кружка NOISE',790,array[]::text[],array['./images/mug-noise.jpg']::text[],'Матовая керамика, устойчивая к посудомоечной машине.','Объём',array['300 мл','500 мл']::text[]),
  ('Значки','Значок FREQUENCY',150,array[]::text[],array['./images/badge-frequency.jpg']::text[],'Металлический значок с булавкой.','Диаметр',array['25 мм','38 мм','56 мм']::text[]),
  ('Магниты','Магнит VOID LOGO',190,array[]::text[],array['./images/magnet-void.jpg']::text[],'Виниловый магнит с плотной подложкой.','Размер',array['60×40 мм']::text[]),
  ('Стикеры','Стикер GLITCH',90,array[]::text[],array['./images/sticker-glitch.jpg']::text[],'Виниловый стикер с ламинацией.','Размер',array['60×60 мм','90×90 мм']::text[])
) as v(category,name,price,sizes,images,description,variant_label,variants)
where not exists (select 1 from public.products);
