-- Seed staff users
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmed_at,
  last_sign_in_at,
  role,
  aud,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'dev.agent@example.com',
    crypt('Password123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'finance.agent@example.com',
    crypt('Password123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    now(),
    now()
  )
on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  confirmed_at = excluded.confirmed_at,
  last_sign_in_at = excluded.last_sign_in_at,
  updated_at = excluded.updated_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data;

-- Seed matching profiles
insert into public.profiles (id, full_name, department)
values
  ('11111111-1111-1111-1111-111111111111', 'Devon Dev', 'Dev'),
  ('22222222-2222-2222-2222-222222222222', 'Farah Finance', 'Finance')
on conflict (id) do update set
  full_name = excluded.full_name,
  department = excluded.department;

-- Sample tickets across departments
insert into public.tickets (
  name,
  email,
  subject,
  description,
  category,
  urgency,
  department,
  status,
  sla_deadline,
  created_at,
  updated_at
)
values
  (
    'Acme Corp Finance',
    'finance@acmecorp.example',
    'Invoice shows incorrect total',
    'Our latest invoice total does not match the agreed upon contract price. Please review and correct.',
    'Finance',
    'High',
    'Finance',
    'Open',
    now() + interval '24 hours',
    now() - interval '2 hours',
    now() - interval '2 hours'
  ),
  (
    'Acme Corp Product',
    'product@acmecorp.example',
    'Bug in latest release blocks deploy',
    'After deploying the latest release our CI pipeline fails with a null pointer exception in the payment module.',
    'Bug',
    'High',
    'Dev',
    'In Progress',
    now() + interval '12 hours',
    now() - interval '4 hours',
    now() - interval '30 minutes'
  ),
  (
    'Contoso',
    'support@contoso.example',
    'Request for usage analytics export',
    'We need a full export of the last quarter usage analytics for compliance review.',
    'General Inquiry',
    'Medium',
    'Support',
    'Open',
    now() + interval '48 hours',
    now() - interval '1 day',
    now() - interval '1 day'
  )
on conflict do nothing;
