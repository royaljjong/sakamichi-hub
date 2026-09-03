create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  private_id_hash text not null check (char_length(private_id_hash) = 64),
  password_hash text not null,
  category text not null check (category in ('takedown', 'correction', 'general')),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 5000),
  status text not null default 'received' check (status in ('received', 'reviewing', 'answered', 'closed')),
  admin_reply text check (admin_reply is null or char_length(admin_reply) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inquiries_private_id_hash_created_at_idx on public.inquiries (private_id_hash, created_at desc);
alter table public.inquiries enable row level security;
revoke all on table public.inquiries from public, anon, authenticated;

create or replace function public.create_private_inquiry(
  p_private_id text,
  p_password text,
  p_category text,
  p_title text,
  p_body text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_id text := lower(trim(p_private_id));
begin
  if char_length(normalized_id) not between 4 and 40
    or char_length(p_password) not between 8 and 128
    or p_category not in ('takedown', 'correction', 'general')
    or char_length(trim(p_title)) not between 1 and 120
    or char_length(trim(p_body)) not between 1 and 5000 then
    raise exception 'invalid inquiry input';
  end if;

  if (select count(*) from public.inquiries where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'temporarily unavailable';
  end if;

  insert into public.inquiries (private_id_hash, password_hash, category, title, body)
  values (
    encode(extensions.digest(convert_to(normalized_id, 'UTF8'), 'sha256'), 'hex'),
    extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
    p_category,
    trim(p_title),
    trim(p_body)
  );
end;
$$;

create or replace function public.read_private_inquiries(
  p_private_id text,
  p_password text
)
returns table (
  id uuid,
  category text,
  title text,
  body text,
  status text,
  admin_reply text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select i.id, i.category, i.title, i.body, i.status,
         i.admin_reply, i.created_at, i.updated_at
  from public.inquiries i
  where i.private_id_hash = encode(extensions.digest(convert_to(lower(trim(p_private_id)), 'UTF8'), 'sha256'), 'hex')
    and i.password_hash = extensions.crypt(p_password, i.password_hash)
  order by i.created_at desc
  limit 50;
$$;

revoke all on function public.create_private_inquiry(text, text, text, text, text) from public;
revoke all on function public.read_private_inquiries(text, text) from public;
grant execute on function public.create_private_inquiry(text, text, text, text, text) to anon, authenticated;
grant execute on function public.read_private_inquiries(text, text) to anon, authenticated;

comment on table public.inquiries is 'Private no-account inquiries. Temporary IDs and passwords are stored only as hashes.';
comment on function public.create_private_inquiry(text, text, text, text, text) is 'Creates an inquiry for a caller-chosen temporary ID and password.';
comment on function public.read_private_inquiries(text, text) is 'Returns inquiries only when both temporary ID and password match.';
