create table if not exists scholarships (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  provider text,
  country text,
  amount text,
  deadline date,
  degree_levels text[] default '{}',
  fields_of_study text[] default '{}',
  eligibility text,
  description text,
  url text,
  source text,
  match_score int default 0,
  created_at timestamptz default now()
);

create table if not exists saved_scholarships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  scholarship_id uuid references scholarships(id) on delete cascade,
  notes text,
  saved_at timestamptz default now(),
  unique(user_id, scholarship_id)
);
alter table saved_scholarships enable row level security;
create policy "Users can manage own saved scholarships" on saved_scholarships for all using (auth.uid() = user_id);
