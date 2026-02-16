-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor) to create the table.

create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  group_id text not null unique,
  name text not null,
  description text default '',
  price text not null,
  price_type text not null check (price_type in ('one-time', 'subscription')),
  seller text not null,
  created_at timestamptz default now()
);

-- Optional: enable RLS and allow service role full access (default).
-- For public read-only access from anon, add:
-- alter table public.marketplace_listings enable row level security;
-- create policy "Allow public read" on public.marketplace_listings for select using (true);

-- Seed your existing DCA listing (run once):
-- insert into public.marketplace_listings (group_id, name, description, price, price_type, seller)
-- values (
--   'strategy.dca.1771267923284',
--   'DCA',
--   'Dollar-cost averaging strategy. Encrypted parameters; full details after purchase.',
--   '0.01',
--   'one-time',
--   'kasanova.nova-sdk.near'
-- )
-- on conflict (group_id) do nothing;
