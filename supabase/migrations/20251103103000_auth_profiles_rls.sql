-- Profiles table for staff metadata
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  department text check (department in ('Billing','Engineering','Product','Trust & Safety')),
  created_at timestamptz default now()
);

-- Ensure tickets table has a nullable department column for classification workflows
alter table public.tickets
  add column if not exists department text;

alter table public.tickets
  alter column department drop not null;

alter table public.tickets
  alter column department drop default;

-- Enforce row level security tailored to department access
alter table public.tickets enable row level security;

drop policy if exists "Anyone can submit tickets" on public.tickets;
drop policy if exists "Users can view own tickets by email" on public.tickets;
drop policy if exists "Agents can view all tickets" on public.tickets;
drop policy if exists "Agents can update tickets" on public.tickets;
drop policy if exists "Agents can delete tickets" on public.tickets;

create policy "anon can insert ticket"
  on public.tickets for insert
  to anon
  with check (true);

create policy "staff read own dept"
  on public.tickets for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.department = public.tickets.department
    )
  );

create policy "staff update own dept"
  on public.tickets for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.department = public.tickets.department
    )
  );
