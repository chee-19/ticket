# Helpdesk Triage Assistant

This project is a Vite + React + Tailwind front-end that integrates with Supabase for ticket storage, authentication, and automation hooks.

## Staff Accounts

Staff access is managed through Supabase Auth and the companion `public.profiles` table. To onboard a new agent:

1. Create the user in Supabase Auth (email + password). You can do this through the Supabase dashboard or via the CLI `supabase auth signup` command.
2. Insert or upsert the matching profile with an allowed department. Profiles must use one of: `Billing`, `Engineering`, `Product`, or `Trust & Safety`.

Example SQL templates (replace the bracketed values):

```sql
-- Engineering agent
select auth.admin.create_user(
  email := 'ENGINEERING_EMAIL',
  password := 'ENGINEERING_PASSWORD',
  email_confirm := true
);

insert into public.profiles (id, full_name, department)
values ('ENGINEERING_USER_ID', 'Full Name', 'Engineering')
on conflict (id) do update set
  full_name = excluded.full_name,
  department = excluded.department;
```

```sql
-- Billing agent
select auth.admin.create_user(
  email := 'BILLING_EMAIL',
  password := 'BILLING_PASSWORD',
  email_confirm := true
);

insert into public.profiles (id, full_name, department)
values ('BILLING_USER_ID', 'Full Name', 'Billing')
on conflict (id) do update set
  full_name = excluded.full_name,
  department = excluded.department;
```

> ℹ️ When using the SQL templates above, the `ENGINEERING_USER_ID`/`BILLING_USER_ID` values should match the `id` returned from `auth.admin.create_user`.

Row-Level Security (RLS) now blocks unauthenticated reads and restricts authenticated staff to tickets for their own department. Public ticket submissions remain open via the anonymous insert policy.

The local development seed script (`supabase/seed.sql`) provisions sample Engineering and Billing agents (password `Password123!`) plus example tickets for each department. Run `supabase db reset` to apply the latest migrations and seeds when working locally.
