create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  store_name text default 'My Store',
  subscription_status text default 'free',
  plan_id text default 'free',
  encrypted_user_api_key text,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  product text,
  product_image_url text,
  target_language text not null,
  target_platform text not null,
  target_audience text,
  campaign_goal text,
  brand_tone text,
  keywords text,
  output_text text not null,
  created_at timestamptz default now()
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_type text not null,
  token_estimate integer default 0,
  model text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.generations enable row level security;
alter table public.usage_events enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can read own generations"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "Users can insert own generations"
  on public.generations for insert
  with check (auth.uid() = user_id);

create policy "Users can read own usage"
  on public.usage_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage"
  on public.usage_events for insert
  with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, store_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'store_name', 'My Store')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
