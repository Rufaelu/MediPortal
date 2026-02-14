-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create specific types
create type user_role as enum ('PATIENT', 'DOCTOR', 'ADMIN');
create type admission_status as enum ('ON_THE_WAY', 'ADMITTED', 'DISCHARGED');
create type prescription_status as enum ('ORDERED', 'APPROVED', 'READY_FOR_PICKUP');
create type schedule_type as enum ('SURGERY', 'CONSULTATION', 'ROUNDS', 'BREAK');
create type emergency_status as enum ('ACTIVE', 'RESPONDED', 'RESOLVED');
create type sex_type as enum ('M', 'F', 'Other');

-- 1. Profiles Table (Linked to auth.users)
-- This table extends the default Supabase auth.users table
create table public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text unique not null,
  name text not null,
  role user_role not null default 'PATIENT',
  photo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- 2. Medical Records Table
create table public.medical_records (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  blood_type text,
  allergies text,
  conditions text,
  medications text, -- Current medications summary
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.medical_records enable row level security;

-- Policies
create policy "Users can view own medical record"
  on public.medical_records for select
  using ( auth.uid() = user_id );

create policy "Doctors and Admins can view all medical records"
  on public.medical_records for select
  using ( exists (select 1 from public.profiles where id = auth.uid() and role in ('DOCTOR', 'ADMIN')) );

create policy "Doctors and Admins can update medical records"
  on public.medical_records for update
  using ( exists (select 1 from public.profiles where id = auth.uid() and role in ('DOCTOR', 'ADMIN')) );

-- 3. Medical History Table
create table public.medical_history (
  id uuid default uuid_generate_v4() primary key,
  record_id uuid references public.medical_records(id) on delete cascade not null,
  date timestamp with time zone not null,
  event text not null,
  details text,
  visit_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.medical_history enable row level security;

create policy "View medical history access"
  on public.medical_history for select
  using ( 
    exists (select 1 from public.medical_records where id = medical_history.record_id and user_id = auth.uid()) 
    or 
    exists (select 1 from public.profiles where id = auth.uid() and role in ('DOCTOR', 'ADMIN'))
  );

-- 4. Prescriptions Table
create table public.prescriptions (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.profiles(id) on delete set null,
  prescribed_by uuid references public.profiles(id) on delete set null, -- Doctor ID
  medication text not null,
  dosage text not null,
  status prescription_status default 'ORDERED',
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.prescriptions enable row level security;

create policy "Users view own prescriptions"
  on public.prescriptions for select
  using ( auth.uid() = patient_id );

create policy "Doctors/Admins view all prescriptions"
  on public.prescriptions for select
  using ( exists (select 1 from public.profiles where id = auth.uid() and role in ('DOCTOR', 'ADMIN')) );

-- 5. Pharmacy Inventory Table
create table public.pharmacy_inventory (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  available boolean default true,
  category text,
  last_restocked timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.pharmacy_inventory enable row level security;

create policy "Pharmacy inventory viewable by all"
  on public.pharmacy_inventory for select
  using ( true );

-- 6. Emergency Alerts Table
create table public.emergency_alerts (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.profiles(id) on delete set null, -- Optional, could be guest
  patient_name text, -- fallback if no patient_id or for guests
  age text,
  sex sex_type,
  incident_type text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  location_lat float,
  location_lng float,
  status emergency_status default 'ACTIVE',
  medical_summary_snapshot jsonb, -- Snapshot of medical record at time of alert
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.emergency_alerts enable row level security;

-- 7. Inpatients Table
create table public.inpatients (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.profiles(id) on delete set null,
  patient_name text not null,
  dob date,
  status admission_status default 'ON_THE_WAY',
  admission_date timestamp with time zone default timezone('utc'::text, now()) not null,
  discharge_date timestamp with time zone,
  ward text,
  attending_physician_id uuid references public.profiles(id) on delete set null,
  medical_summary_snapshot jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.inpatients enable row level security;

-- 8. Schedules Table
create table public.schedules (
  id uuid default uuid_generate_v4() primary key,
  doctor_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  time_string text, -- keeping as string to match frontend '09:00 AM' format for now, or use timestamp
  type schedule_type not null,
  patient_name text, -- redundant if linked, but useful for quick display
  patient_id uuid references public.profiles(id) on delete set null,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.schedules enable row level security;

-- 9. Medical Board Meetings Table
create table public.board_meetings (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  meeting_date date,
  meeting_time text,
  specialty text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.board_meeting_participants (
  meeting_id uuid references public.board_meetings(id) on delete cascade,
  participant_name text, -- or link to user_id if they are system users
  primary key (meeting_id, participant_name)
);

alter table public.board_meetings enable row level security;
alter table public.board_meeting_participants enable row level security;

-- Helper function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role, photo_url)
  values (new.id, new.email, new.raw_user_meta_data->>'name', (new.raw_user_meta_data->>'role')::user_role, new.raw_user_meta_data->>'photo');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new auth users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
