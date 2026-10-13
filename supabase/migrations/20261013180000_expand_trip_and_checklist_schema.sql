-- ==============================================================================
-- VisaVoyage AI - Database Schema Expansion (Phase 8)
-- Adds trips, document_checklists, checklist_items, application_milestones, saved_sources
-- Non-destructive: preserves existing profiles, travel_itineraries, visa_checks, document_checks
-- ==============================================================================

-- 1. Trips Management Table
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

-- 2. Document Checklists Table
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

-- 3. Individual Checklist Items Table
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

-- 4. Application Milestones Table (Timeline preparation tracker)
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

-- 5. Saved Official Consular Sources Table
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

-- 6. Enable Row Level Security (RLS) on All New Tables
alter table public.trips enable row level security;
alter table public.document_checklists enable row level security;
alter table public.checklist_items enable row level security;
alter table public.application_milestones enable row level security;
alter table public.saved_sources enable row level security;

-- 7. Drop existing policies if re-executing
drop policy if exists "Users can manage their own trips" on public.trips;
drop policy if exists "Users can manage their own document checklists" on public.document_checklists;
drop policy if exists "Users can manage their own checklist items" on public.checklist_items;
drop policy if exists "Users can manage their own application milestones" on public.application_milestones;
drop policy if exists "Users can manage their own saved sources" on public.saved_sources;

-- 8. Create Strict Tenant-Isolated RLS Policies
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

-- 9. Performance Indexes
create index if not exists idx_trips_user_id on public.trips(user_id);
create index if not exists idx_trips_departure_date on public.trips(departure_date);
create index if not exists idx_document_checklists_user_id on public.document_checklists(user_id);
create index if not exists idx_document_checklists_trip_id on public.document_checklists(trip_id);
create index if not exists idx_checklist_items_checklist_id on public.checklist_items(checklist_id);
create index if not exists idx_checklist_items_user_id on public.checklist_items(user_id);
create index if not exists idx_application_milestones_trip_id on public.application_milestones(trip_id);
create index if not exists idx_application_milestones_user_id on public.application_milestones(user_id);
create index if not exists idx_saved_sources_user_id on public.saved_sources(user_id);
