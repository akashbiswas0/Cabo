-- Run in Supabase SQL Editor to add IPFS CID to listings (for retrieve / display).

alter table public.marketplace_listings
  add column if not exists cid text;

comment on column public.marketplace_listings.cid is 'IPFS CID of the encrypted strategy file from NOVA upload.';
