-- ScholarPath Database Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/eysztooykplcrnbqnvfl/sql

-- Profiles (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  nationality text default 'Liberian',
  date_of_birth text,
  gender text,
  gpa numeric(3,2) default 3.0,
  degree_level text default 'undergraduate',
  field_of_study text,
  current_institution text,
  graduation_year int default 2025,
  english_proficiency text default 'fluent',
  financial_need boolean default false,
  extracurriculars text[],
  work_experience text,
  achievements text,
  personal_statement text,
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can upsert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Saved Scholarships
create table if not exists public.saved_scholarships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  scholarship_id text not null,
  scholarship_data jsonb not null,
  saved_at timestamptz default now(),
  unique(user_id, scholarship_id)
);
alter table public.saved_scholarships enable row level security;
create policy "Users manage own saved scholarships" on public.saved_scholarships for all using (auth.uid() = user_id);

-- Applications
create table if not exists public.applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  scholarship_id text,
  scholarship_title text not null,
  scholarship_provider text default '',
  scholarship_description text default '',
  scholarship_url text default '',
  status text default 'drafting' check (status in ('drafting','submitted','interview','accepted','rejected')),
  deadline text,
  essay_prompt text,
  essay_draft text default '',
  essay_version int default 1,
  word_limit int default 650,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.applications enable row level security;
create policy "Users manage own applications" on public.applications for all using (auth.uid() = user_id);

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
