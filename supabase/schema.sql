-- OKDX.Merch schema (fresh database). Run once in Supabase → SQL Editor.
-- Compact design: no promo codes, no sale_price, order items stored as short JSON keys.

-- =========================
-- PRODUCTS
-- =========================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  category text not null,
  name text not null,
  price numeric(10,2) not null,
  sizes text[] not null default '{}',
  images text[] not null default '{}',
  description text not null default '',
  variant_label text,
  variants text[]
);

-- Visitors may read every column EXCEPT price (prices are admin-only).
revoke all on public.products from anon;
grant select (id, created_at, category, name, sizes, images, description, variant_label, variants)
  on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;

alter table public.products enable row level security;
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products for select to anon using (true);
drop policy if exists "products_auth_all" on public.products;
create policy "products_auth_all" on public.products for all to authenticated using (true) with check (true);

-- =========================
-- ORDERS
-- items: [{"p":"<product uuid>","q":2,"s":"M","v":"Black","n":"<name>","r":25}]
--   p = product id, q = qty, s = size, v = variant, n = name, r = unit price
-- =========================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_name varchar(100) not null,
  client_contact varchar(80) not null,
  items jsonb not null default '[]'::jsonb,
  total_price numeric(10,2) not null default 0,
  status varchar(12) not null default 'Новый',
  packaging varchar(16)
);

-- Server-side pricing: visitors never send or see prices.
create or replace function public.orders_fill_prices()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  it jsonb;
  out_items jsonb := '[]'::jsonb;
  pr record;
  total numeric := 0;
begin
  if coalesce(auth.role(), 'anon') <> 'anon' then
    return new; -- admins / restores keep their own values
  end if;
  if jsonb_array_length(new.items) = 0 or jsonb_array_length(new.items) > 50 then
    raise exception 'invalid items';
  end if;
  for it in select * from jsonb_array_elements(new.items) loop
    select name, price into pr from public.products where id = (it->>'p')::uuid;
    if not found then raise exception 'unknown product'; end if;
    if (it->>'q')::int < 1 or (it->>'q')::int > 99 then raise exception 'invalid qty'; end if;
    out_items := out_items || jsonb_strip_nulls(jsonb_build_object(
      'p', it->>'p', 'q', (it->>'q')::int, 's', it->>'s', 'v', it->>'v',
      'n', pr.name, 'r', pr.price));
    total := total + pr.price * (it->>'q')::int;
  end loop;
  new.items := out_items;
  new.total_price := total;
  new.status := 'Новый';
  new.packaging := null;
  return new;
end $$;

drop trigger if exists orders_fill_prices on public.orders;
create trigger orders_fill_prices before insert on public.orders
  for each row execute function public.orders_fill_prices();

grant insert (client_name, client_contact, items) on public.orders to anon;
grant select, insert, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;

alter table public.orders enable row level security;
drop policy if exists "orders_anon_insert" on public.orders;
create policy "orders_anon_insert" on public.orders for insert to anon with check (true);
drop policy if exists "orders_auth_all" on public.orders;
create policy "orders_auth_all" on public.orders for all to authenticated using (true) with check (true);

-- =========================
-- APP SETTINGS (key → JSON text)
-- =========================
create table if not exists public.app_settings (
  key varchar(32) primary key,
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
  perform 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_settings';
  if not found then alter publication supabase_realtime add table public.app_settings; end if;
end $$;
