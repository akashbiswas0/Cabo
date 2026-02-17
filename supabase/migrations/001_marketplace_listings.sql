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


-- Run in Supabase SQL Editor to add IPFS CID to listings (for retrieve / display).

alter table public.marketplace_listings
  add column if not exists cid text;

comment on column public.marketplace_listings.cid is 'IPFS CID of the encrypted strategy file from NOVA upload.';



-- One purchase per user per strategy. Run in Supabase SQL Editor.

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  buyer_account_id text not null,
  group_id text not null,
  purchased_at timestamptz default now(),
  unique(buyer_account_id, group_id)
);

comment on table public.purchases is 'One row per user per strategy purchase; enforces one-time purchase per user.';

create index if not exists idx_purchases_buyer on public.purchases(buyer_account_id);
