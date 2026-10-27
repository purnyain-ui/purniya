-- Run once in the Supabase SQL Editor before using Admin > Shipping.
create table if not exists public.shiprocket_shipments (
  order_id text primary key references public.orders(id),
  reference_id text not null unique,
  shiprocket_order_id bigint unique,
  shipment_id bigint unique,
  awb_code text,
  courier_name text,
  pickup_location text not null,
  weight numeric not null check (weight > 0), -- kg, packed parcel
  length numeric not null check (length >= 0.5), -- cm
  breadth numeric not null check (breadth >= 0.5), -- cm
  height numeric not null check (height >= 0.5), -- cm
  state text not null default 'creating' check (state in
    ('creating', 'created', 'assigning_awb', 'awb_assigned', 'requesting_pickup', 'pickup_requested', 'needs_review')),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.shiprocket_shipments enable row level security;
revoke all on public.shiprocket_shipments from anon, authenticated;
grant all on public.shiprocket_shipments to service_role;
