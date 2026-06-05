create table if not exists profiles (
  id uuid references auth.users primary key,
  full_name text,
  email text,
  nationality text default 'Liberian',
  date_of_birth date,
  gender text,
  gpa numeric(3,2),
  degree_level text,
  field_of_study text,
  current_institution text,
  graduation_year int,
  english_proficiency text default 'fluent',
  financial_need boolean default false,
  extracurriculars text[] default '{}',
  work_experience text,
  achievements text,
  personal_statement text,
  plan text default 'free',
  usage_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
