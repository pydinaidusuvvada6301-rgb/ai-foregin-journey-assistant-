-- ==============================================================================
-- VisaVoyage AI / Foreign Journey Advisor - Supabase Database Migration
-- Creates all application tables, relations, triggers, indexes, and RLS policies
-- ==============================================================================

-- 1. Enable Required PostgreSQL Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. User Profiles Table (Linked directly to Supabase Auth)
create table if not exists public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    full_name text not null,
    home_country text not null default 'United States',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Travel Itineraries Table
create table if not exists public.travel_itineraries (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    destination text not null,
    duration_days integer not null check (duration_days > 0 and duration_days <= 365),
    budget_range text not null,
    itinerary_details jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Visa Requirements Checks Table
create table if not exists public.visa_checks (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    passport_country text not null,
    destination_country text not null,
    visa_result jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Multimodal Document Checks Table
create table if not exists public.document_checks (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    document_type text not null,
    file_name text not null,
    analysis_result jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Enable Row Level Security (RLS) on All Tables
alter table public.profiles enable row level security;
alter table public.travel_itineraries enable row level security;
alter table public.visa_checks enable row level security;
alter table public.document_checks enable row level security;

-- 7. Drop existing policies for clean idempotency if re-executing
drop policy if exists "Users can perform CRUD on their own profile" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;

drop policy if exists "Users can perform CRUD on their own itineraries" on public.travel_itineraries;
drop policy if exists "Users can view their own itineraries" on public.travel_itineraries;
drop policy if exists "Users can create their own itineraries" on public.travel_itineraries;
drop policy if exists "Users can delete their own itineraries" on public.travel_itineraries;

drop policy if exists "Users can perform CRUD on their own visa checks" on public.visa_checks;
drop policy if exists "Users can view their own visa checks" on public.visa_checks;
drop policy if exists "Users can create their own visa checks" on public.visa_checks;
drop policy if exists "Users can delete their own visa checks" on public.visa_checks;

drop policy if exists "Users can perform CRUD on their own document checks" on public.document_checks;
drop policy if exists "Users can view their own document checks" on public.document_checks;
drop policy if exists "Users can create their own document checks" on public.document_checks;
drop policy if exists "Users can delete their own document checks" on public.document_checks;

-- 8. Row Level Security Policies (Enforce tenant boundary: users only access their own records)
create policy "Users can perform CRUD on their own profile"
    on public.profiles for all
    using (auth.uid() = id)
    with check (auth.uid() = id);

create policy "Users can perform CRUD on their own itineraries"
    on public.travel_itineraries for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can perform CRUD on their own visa checks"
    on public.visa_checks for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can perform CRUD on their own document checks"
    on public.document_checks for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 9. Automatic Profile Creation Trigger on Supabase Auth Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, full_name, home_country)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        coalesce(new.raw_user_meta_data->>'home_country', 'United States')
    )
    on conflict (id) do update set
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        home_country = coalesce(excluded.home_country, public.profiles.home_country);
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- 10. Automatically Maintain updated_at Timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists on_profiles_updated on public.profiles;
create trigger on_profiles_updated
    before update on public.profiles
    for each row execute function public.handle_updated_at();

-- 11. Performance Indexes for Rapid Dashboard & History Lookups
create index if not exists idx_travel_itineraries_user_id on public.travel_itineraries(user_id);
create index if not exists idx_travel_itineraries_created_at on public.travel_itineraries(created_at desc);

create index if not exists idx_visa_checks_user_id on public.visa_checks(user_id);
create index if not exists idx_visa_checks_created_at on public.visa_checks(created_at desc);

create index if not exists idx_document_checks_user_id on public.document_checks(user_id);
create index if not exists idx_document_checks_created_at on public.document_checks(created_at desc);
