create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  scholarship_id uuid references scholarships(id),
  status text default 'drafting',
  deadline date,
  essay_prompt text,
  essay_draft text,
  essay_version int default 1,
  word_limit int default 500,
  notes text,
  documents text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table applications enable row level security;
create policy "Users can manage own applications" on applications for all using (auth.uid() = user_id);

create table if not exists essay_versions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id) on delete cascade,
  version int,
  content text,
  saved_at timestamptz default now()
);
alter table essay_versions enable row level security;
create policy "Users can view own essay versions" on essay_versions for all using (
  exists (select 1 from applications where applications.id = essay_versions.application_id and applications.user_id = auth.uid())
);
