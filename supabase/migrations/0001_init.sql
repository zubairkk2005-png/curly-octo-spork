-- ProfitPilot initial schema. Paste into the Supabase SQL editor and run.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null default '',
  business_name text not null default '',
  currency      text not null default 'GBP' check (currency in ('GBP','USD','EUR','PKR')),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------- products
create table if not exists public.products (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users (id) on delete cascade,
  sku                   text not null check (char_length(sku) between 1 and 100),
  name                  text not null check (char_length(name) between 1 and 200),
  marketplace           text not null default 'Amazon' check (marketplace in ('Amazon','eBay','Other')),
  product_cost          numeric(12,2) not null default 0 check (product_cost >= 0),
  default_shipping_cost numeric(12,2) not null default 0 check (default_shipping_cost >= 0),
  default_fee           numeric(12,2) not null default 0 check (default_fee >= 0),
  default_ad_cost       numeric(12,2) not null default 0 check (default_ad_cost >= 0),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (user_id, sku)
);
create index if not exists products_user_idx on public.products (user_id);

-- ------------------------------------------------------------------ orders
-- product_cost is PER UNIT; marketplace_fee, shipping_cost, ad_cost and
-- refund_amount are totals for the order line.
--   revenue = sale_price * quantity
--   profit  = revenue - (product_cost * quantity + fee + shipping + ads + refund)
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  external_order_id text not null check (char_length(external_order_id) between 1 and 100),
  marketplace       text not null default 'Other' check (marketplace in ('Amazon','eBay','Other')),
  order_date        timestamptz not null,
  sku               text not null check (char_length(sku) between 1 and 100),
  product_name      text not null default '',
  quantity          integer not null default 1 check (quantity > 0),
  sale_price        numeric(12,2) not null default 0 check (sale_price >= 0),
  product_cost      numeric(12,2) not null default 0 check (product_cost >= 0),
  marketplace_fee   numeric(12,2) not null default 0 check (marketplace_fee >= 0),
  shipping_cost     numeric(12,2) not null default 0 check (shipping_cost >= 0),
  ad_cost           numeric(12,2) not null default 0 check (ad_cost >= 0),
  refund_amount     numeric(12,2) not null default 0 check (refund_amount >= 0),
  currency          text not null default 'GBP' check (currency in ('GBP','USD','EUR','PKR')),
  created_at        timestamptz not null default now()
);
create index if not exists orders_user_date_idx on public.orders (user_id, order_date desc);
create index if not exists orders_user_sku_idx on public.orders (user_id, sku);
create index if not exists orders_user_marketplace_idx on public.orders (user_id, marketplace);
-- makes re-importing the same file idempotent
create unique index if not exists orders_unique_line_idx
  on public.orders (user_id, marketplace, external_order_id, sku);

-- --------------------------------------------------- updated_at maintenance
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- -------------------------------------- create a profile on signup
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------ row level security
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders   enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "products_all_own" on public.products;
create policy "products_all_own" on public.products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "orders_all_own" on public.orders;
create policy "orders_all_own" on public.orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
