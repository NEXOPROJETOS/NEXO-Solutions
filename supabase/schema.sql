-- Public quote form: visitors may submit requests but cannot read submissions.
create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  company text check (company is null or char_length(company) <= 160),
  email text not null check (char_length(email) <= 254),
  phone text check (phone is null or char_length(phone) <= 40),
  service text not null check (char_length(service) <= 80),
  message text not null check (char_length(trim(message)) between 15 and 5000),
  created_at timestamptz not null default now()
);

alter table public.quote_requests enable row level security;

revoke all on table public.quote_requests from anon, authenticated;
grant insert on table public.quote_requests to anon;

drop policy if exists "Allow public quote submissions" on public.quote_requests;
create policy "Allow public quote submissions"
  on public.quote_requests
  for insert
  to anon
  with check (
    char_length(trim(name)) between 2 and 120
    and char_length(email) <= 254
    and char_length(service) <= 80
    and char_length(trim(message)) between 15 and 5000
  );
