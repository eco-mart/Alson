-- Run this in your ORIGINAL App Supabase SQL Editor

-- 1. Create a public users table
create table public.users (
  id uuid not null references auth.users on delete cascade,
  email text,
  name text,
  created_at timestamptz default now(),
  primary key (id)
);

-- 2. Enable RLS
alter table public.users enable row level security;

-- 3. Create policies (allow users to read their own data)
create policy "Users can view their own data" on public.users
  for select using (auth.uid() = id);

-- 4. Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    -- Extract username from metadata (passed during signUp)
    new.raw_user_meta_data->>'username'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 5. Trigger to call the function on insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
