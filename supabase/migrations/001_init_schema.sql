-- OmniVision — roles e planos de crise Geo
-- Execute no SQL Editor do Supabase (ou via CLI).

create extension if not exists "pgcrypto";

create type public.app_role as enum ('Diretor', 'Gestor', 'Operacional');

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role public.app_role not null default 'Operacional',
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'Operacional');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.planos_crise_geo (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  status text not null default 'aberto',
  owner_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.planos_crise_geo enable row level security;

create policy "geo_plans_read"
  on public.planos_crise_geo for select
  to authenticated
  using (true);

create policy "geo_plans_write"
  on public.planos_crise_geo for all
  to authenticated
  using (true)
  with check (true);
