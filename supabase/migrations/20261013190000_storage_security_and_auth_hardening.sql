-- ==============================================================================
-- VisaVoyage AI — Authentication, Storage, & RLS Security Hardening
-- Migration: 20261013190000_storage_security_and_auth_hardening.sql
-- ==============================================================================

-- 1. Create Private Supabase Storage Bucket for Sensitive Travel Documents
-- Enforces: public = false (no anonymous access), 10MB size limit, strict MIME whitelist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'travel-documents',
    'travel-documents',
    false,
    10485760, -- 10 Megabytes max
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- 2. Drop existing storage policies for idempotency
drop policy if exists "Users can view their own travel documents" on storage.objects;
drop policy if exists "Users can upload their own travel documents" on storage.objects;
drop policy if exists "Users can update their own travel documents" on storage.objects;
drop policy if exists "Users can delete their own travel documents" on storage.objects;

-- 3. Enforce Strict Folder Ownership on Storage Objects
-- Pattern: <bucket_id>/<user_id>/<filename>
-- Authenticated users can only read, write, update, and delete files inside their own <user_id> folder
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

-- 4. Audit & Hardened Granular RLS Policies on Core Tables
-- Ensure WITH CHECK clauses prevent user_id ownership spoofing on INSERT and UPDATE

-- Profiles table
drop policy if exists "Users can select their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can delete their own profile" on public.profiles;

create policy "Users can select their own profile"
    on public.profiles for select
    to authenticated
    using (auth.uid() = id);

create policy "Users can update their own profile"
    on public.profiles for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

create policy "Users can insert their own profile"
    on public.profiles for insert
    to authenticated
    with check (auth.uid() = id);

create policy "Users can delete their own profile"
    on public.profiles for delete
    to authenticated
    using (auth.uid() = id);

-- Travel Itineraries table
drop policy if exists "Users can select their own itineraries" on public.travel_itineraries;
drop policy if exists "Users can insert their own itineraries" on public.travel_itineraries;
drop policy if exists "Users can update their own itineraries" on public.travel_itineraries;
drop policy if exists "Users can delete their own itineraries" on public.travel_itineraries;

create policy "Users can select their own itineraries"
    on public.travel_itineraries for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can insert their own itineraries"
    on public.travel_itineraries for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own itineraries"
    on public.travel_itineraries for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own itineraries"
    on public.travel_itineraries for delete
    to authenticated
    using (auth.uid() = user_id);

-- Visa Checks table
drop policy if exists "Users can select their own visa checks" on public.visa_checks;
drop policy if exists "Users can insert their own visa checks" on public.visa_checks;
drop policy if exists "Users can update their own visa checks" on public.visa_checks;
drop policy if exists "Users can delete their own visa checks" on public.visa_checks;

create policy "Users can select their own visa checks"
    on public.visa_checks for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can insert their own visa checks"
    on public.visa_checks for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own visa checks"
    on public.visa_checks for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own visa checks"
    on public.visa_checks for delete
    to authenticated
    using (auth.uid() = user_id);

-- Document Checks table
drop policy if exists "Users can select their own document checks" on public.document_checks;
drop policy if exists "Users can insert their own document checks" on public.document_checks;
drop policy if exists "Users can update their own document checks" on public.document_checks;
drop policy if exists "Users can delete their own document checks" on public.document_checks;

create policy "Users can select their own document checks"
    on public.document_checks for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can insert their own document checks"
    on public.document_checks for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own document checks"
    on public.document_checks for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own document checks"
    on public.document_checks for delete
    to authenticated
    using (auth.uid() = user_id);

-- Trips table
drop policy if exists "Users can select their own trips" on public.trips;
drop policy if exists "Users can insert their own trips" on public.trips;
drop policy if exists "Users can update their own trips" on public.trips;
drop policy if exists "Users can delete their own trips" on public.trips;

create policy "Users can select their own trips"
    on public.trips for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can insert their own trips"
    on public.trips for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own trips"
    on public.trips for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own trips"
    on public.trips for delete
    to authenticated
    using (auth.uid() = user_id);

-- Document Checklists table
drop policy if exists "Users can select their own checklists" on public.document_checklists;
drop policy if exists "Users can insert their own checklists" on public.document_checklists;
drop policy if exists "Users can update their own checklists" on public.document_checklists;
drop policy if exists "Users can delete their own checklists" on public.document_checklists;

create policy "Users can select their own checklists"
    on public.document_checklists for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can insert their own checklists"
    on public.document_checklists for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own checklists"
    on public.document_checklists for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own checklists"
    on public.document_checklists for delete
    to authenticated
    using (auth.uid() = user_id);

-- Checklist Items table
drop policy if exists "Users can select their own checklist items" on public.checklist_items;
drop policy if exists "Users can insert their own checklist items" on public.checklist_items;
drop policy if exists "Users can update their own checklist items" on public.checklist_items;
drop policy if exists "Users can delete their own checklist items" on public.checklist_items;

create policy "Users can select their own checklist items"
    on public.checklist_items for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can insert their own checklist items"
    on public.checklist_items for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own checklist items"
    on public.checklist_items for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own checklist items"
    on public.checklist_items for delete
    to authenticated
    using (auth.uid() = user_id);

-- Application Milestones table
drop policy if exists "Users can select their own milestones" on public.application_milestones;
drop policy if exists "Users can insert their own milestones" on public.application_milestones;
drop policy if exists "Users can update their own milestones" on public.application_milestones;
drop policy if exists "Users can delete their own milestones" on public.application_milestones;

create policy "Users can select their own milestones"
    on public.application_milestones for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can insert their own milestones"
    on public.application_milestones for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own milestones"
    on public.application_milestones for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own milestones"
    on public.application_milestones for delete
    to authenticated
    using (auth.uid() = user_id);

-- Saved Sources table
drop policy if exists "Users can select their own saved sources" on public.saved_sources;
drop policy if exists "Users can insert their own saved sources" on public.saved_sources;
drop policy if exists "Users can update their own saved sources" on public.saved_sources;
drop policy if exists "Users can delete their own saved sources" on public.saved_sources;

create policy "Users can select their own saved sources"
    on public.saved_sources for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can insert their own saved sources"
    on public.saved_sources for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own saved sources"
    on public.saved_sources for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own saved sources"
    on public.saved_sources for delete
    to authenticated
    using (auth.uid() = user_id);
