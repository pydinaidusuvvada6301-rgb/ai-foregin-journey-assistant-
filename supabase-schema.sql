-- ==============================================================================
-- VisaVoyage AI / Foreign Journey Advisor - Supabase Database Schema
-- Run this single script in your Supabase SQL Editor or via Supabase CLI
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

-- ==============================================================================
-- 12. Phase 8 Expansion: Trips, Checklists, Milestones, and Sources
-- ==============================================================================

-- Trips Management Table
create table if not exists public.trips (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    destination text not null,
    origin_country text not null default 'United States',
    departure_date date,
    return_date date,
    purpose text not null default 'Tourism',
    status text not null default 'Planning' check (status in ('Planning', 'Visa In Progress', 'Ready to Fly', 'Completed', 'Archived')),
    budget_range text default 'Moderate',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Document Checklists Table
create table if not exists public.document_checklists (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    trip_id uuid references public.trips(id) on delete cascade,
    destination_country text not null,
    visa_category text not null default 'Standard Tourist',
    completion_percentage integer not null default 0 check (completion_percentage >= 0 and completion_percentage <= 100),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Individual Checklist Items Table
create table if not exists public.checklist_items (
    id uuid default gen_random_uuid() primary key,
    checklist_id uuid references public.document_checklists(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    category text not null default 'Identification' check (category in ('Identification', 'Financial', 'Travel Logistics', 'Health & Vaccines', 'Accommodation', 'Employment / Academic', 'Other')),
    requirement_level text not null default 'required' check (requirement_level in ('required', 'conditional', 'recommended')),
    status text not null default 'Not started' check (status in ('Not started', 'In progress', 'Ready', 'Needs review')),
    notes text,
    file_reference text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Application Milestones Table (Timeline preparation tracker)
create table if not exists public.application_milestones (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    trip_id uuid references public.trips(id) on delete cascade,
    milestone_name text not null,
    target_date date,
    is_completed boolean not null default false,
    completed_at timestamp with time zone,
    notes text,
    order_index integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Saved Official Consular Sources Table
create table if not exists public.saved_sources (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    destination_country text not null,
    source_name text not null,
    authority_type text not null default 'Government Consular Portal',
    portal_url text not null,
    last_verified_date text,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on All New Tables
alter table public.trips enable row level security;
alter table public.document_checklists enable row level security;
alter table public.checklist_items enable row level security;
alter table public.application_milestones enable row level security;
alter table public.saved_sources enable row level security;

-- Row Level Security Policies
create policy "Users can manage their own trips"
    on public.trips for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can manage their own document checklists"
    on public.document_checklists for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can manage their own checklist items"
    on public.checklist_items for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can manage their own application milestones"
    on public.application_milestones for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can manage their own saved sources"
    on public.saved_sources for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Performance Indexes
create index if not exists idx_trips_user_id on public.trips(user_id);
create index if not exists idx_trips_departure_date on public.trips(departure_date);
create index if not exists idx_document_checklists_user_id on public.document_checklists(user_id);
create index if not exists idx_document_checklists_trip_id on public.document_checklists(trip_id);
create index if not exists idx_checklist_items_checklist_id on public.checklist_items(checklist_id);
create index if not exists idx_checklist_items_user_id on public.checklist_items(user_id);
create index if not exists idx_application_milestones_trip_id on public.application_milestones(trip_id);
create index if not exists idx_application_milestones_user_id on public.application_milestones(user_id);
create index if not exists idx_saved_sources_user_id on public.saved_sources(user_id);

-- ==============================================================================
-- 13. Phase 9 Hardening: Supabase Storage & Granular RLS Policies
-- ==============================================================================

-- Create Private Storage Bucket for Sensitive Documents
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'travel-documents',
    'travel-documents',
    false,
    10485760, -- 10MB
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- Storage Access Policies
drop policy if exists "Users can view their own travel documents" on storage.objects;
drop policy if exists "Users can upload their own travel documents" on storage.objects;
drop policy if exists "Users can update their own travel documents" on storage.objects;
drop policy if exists "Users can delete their own travel documents" on storage.objects;

create policy "Users can view their own travel documents"
    on storage.objects for select
    to authenticated
    using (
        bucket_id = 'travel-documents'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Users can upload their own travel documents"
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'travel-documents'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Users can update their own travel documents"
    on storage.objects for update
    to authenticated
    using (
        bucket_id = 'travel-documents'
        and (storage.foldername(name))[1] = auth.uid()::text
    )
    with check (
        bucket_id = 'travel-documents'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Users can delete their own travel documents"
    on storage.objects for delete
    to authenticated
    using (
        bucket_id = 'travel-documents'
        and (storage.foldername(name))[1] = auth.uid()::text
    );
