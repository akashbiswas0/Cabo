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
