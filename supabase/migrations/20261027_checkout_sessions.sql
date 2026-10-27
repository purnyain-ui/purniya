-- Run in Supabase SQL Editor if checkout_sessions has not been created yet.
create table if not exists public.checkout_sessions (
  razorpay_order_id text primary key,
  payload jsonb not null,
  order_id text,
  created_at timestamptz not null default now()
);
alter table public.checkout_sessions enable row level security;
revoke all on public.checkout_sessions from anon, authenticated;
grant all on public.checkout_sessions to service_role;
