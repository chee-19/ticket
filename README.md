# Helpdesk Triage Assistant

This project is a Vite + React + Tailwind front-end that integrates with Supabase for ticket storage, authentication, and automation hooks.

## Staff Accounts

Staff access is managed through Supabase Auth and the companion `public.profiles` table. To onboard a new agent:

1. Create the user in Supabase Auth (email + password). You can do this through the Supabase dashboard or via the CLI `supabase auth signup` command.
2. Insert or upsert the matching profile with an allowed department. Profiles must use one of: `Finance`, `Dev`, `Product`, `Security`, `Support`, or `All Departments`. Use `All Departments` only for staff who should see every ticket—never assign this value to a ticket row.

Example SQL templates (replace the bracketed values):

```sql
-- Dev agent
select auth.admin.create_user(
  email := 'DEV_EMAIL',
  password := 'DEV_PASSWORD',
  email_confirm := true
);

insert into public.profiles (id, full_name, department)
values ('DEV_USER_ID', 'Full Name', 'Dev')
on conflict (id) do update set
  full_name = excluded.full_name,
  department = excluded.department;
```

```sql
-- Finance agent
select auth.admin.create_user(
  email := 'FINANCE_EMAIL',
  password := 'FINANCE_PASSWORD',
  email_confirm := true
);

insert into public.profiles (id, full_name, department)
values ('FINANCE_USER_ID', 'Full Name', 'Finance')
on conflict (id) do update set
  full_name = excluded.full_name,
  department = excluded.department;
```

> ℹ️ When using the SQL templates above, the `DEV_USER_ID`/`FINANCE_USER_ID` values should match the `id` returned from `auth.admin.create_user`.

Row-Level Security (RLS) now blocks unauthenticated reads and restricts authenticated staff to tickets for their own department. Public ticket submissions remain open via the anonymous insert policy.

The local development seed script (`supabase/seed.sql`) provisions sample Dev and Finance agents (password `Password123!`) plus example tickets across Finance, Dev, and Support. Run `supabase db reset` to apply the latest migrations and seeds when working locally.
