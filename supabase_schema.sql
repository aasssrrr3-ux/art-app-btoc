-- Create projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  status text not null default 'rough', -- 'rough', 'lineart', 'color', 'finish'
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create process_logs table
create table public.process_logs (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  duration_seconds integer not null default 0,
  image_url text, -- Optional, for future use
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.projects enable row level security;
alter table public.process_logs enable row level security;

-- Projects Policies
create policy "Users can select their own projects or public projects"
on public.projects for select
using ( auth.uid() = user_id or is_public = true );

create policy "Users can insert their own projects"
on public.projects for insert
with check ( auth.uid() = user_id );

create policy "Users can update their own projects"
on public.projects for update
using ( auth.uid() = user_id );

create policy "Users can delete their own projects"
on public.projects for delete
using ( auth.uid() = user_id );

-- Process Logs Policies
create policy "Users can select logs for their own projects or public projects"
on public.process_logs for select
using (
  auth.uid() = user_id 
  or exists (
    select 1 from public.projects 
    where projects.id = process_logs.project_id 
    and projects.is_public = true
  )
);

create policy "Users can insert their own logs"
on public.process_logs for insert
with check ( auth.uid() = user_id );

create policy "Users can update their own logs"
on public.process_logs for update
using ( auth.uid() = user_id );

create policy "Users can delete their own logs"
on public.process_logs for delete
using ( auth.uid() = user_id );
