
create table if not exists public.app_settings (
  id smallint primary key default 1,
  whatsapp text not null default '+3197010265771',
  telegram text not null default 'ask2ces',
  email text not null default 'support@2cesenergy.com',
  ces_fee numeric(10,4) not null default 1.65,
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1)
);

insert into public.app_settings (id) values (1) on conflict (id) do nothing;

alter table public.app_settings enable row level security;

-- Public read (landing page needs the values)
drop policy if exists "Public can read settings" on public.app_settings;
create policy "Public can read settings"
on public.app_settings for select
to anon, authenticated
using (true);

-- No public write: writes only happen via service role from server functions
drop policy if exists "No public writes" on public.app_settings;
create policy "No public writes"
on public.app_settings for all
to anon, authenticated
using (false) with check (false);

-- Audit log of admin actions (optional but useful)
create table if not exists public.admin_audit (
  id bigserial primary key,
  role text not null,
  action text not null,
  ip text,
  created_at timestamptz not null default now()
);
alter table public.admin_audit enable row level security;
drop policy if exists "No public access audit" on public.admin_audit;
create policy "No public access audit"
on public.admin_audit for all
to anon, authenticated
using (false) with check (false);
