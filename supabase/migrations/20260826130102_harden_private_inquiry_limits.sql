create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

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
  normalized_id_hash text;
begin
  if char_length(normalized_id) not between 4 and 40
    or char_length(p_password) not between 8 and 128
    or p_category not in ('takedown', 'correction', 'general')
    or char_length(trim(p_title)) not between 1 and 120
    or char_length(trim(p_body)) not between 1 and 5000 then
    raise exception 'invalid inquiry input';
  end if;

  normalized_id_hash := encode(
    extensions.digest(convert_to(normalized_id, 'UTF8'), 'sha256'),
    'hex'
  );

  -- Serialize the small public write budget so concurrent requests cannot all
  -- pass the count check before inserting.
  perform pg_catalog.pg_advisory_xact_lock(1964750226);

  if (select count(*) from public.inquiries where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'temporarily unavailable';
  end if;

  -- The read RPC performs bcrypt once per row sharing an ID hash. Keep that
  -- work bounded and align storage with the documented 50-row mailbox limit.
  if (select count(*) from public.inquiries where private_id_hash = normalized_id_hash) >= 50 then
    raise exception 'temporarily unavailable';
  end if;

  insert into public.inquiries (private_id_hash, password_hash, category, title, body)
  values (
    normalized_id_hash,
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
language plpgsql
security definer
set search_path = ''
as $$
begin
  if char_length(trim(p_private_id)) not between 4 and 40
    or char_length(p_password) not between 8 and 128 then
    return;
  end if;

  return query
  select i.id, i.category, i.title, i.body, i.status,
         i.admin_reply, i.created_at, i.updated_at
  from public.inquiries i
  where i.private_id_hash = encode(
      extensions.digest(convert_to(lower(trim(p_private_id)), 'UTF8'), 'sha256'),
      'hex'
    )
    and i.password_hash = extensions.crypt(p_password, i.password_hash)
  order by i.created_at desc
  limit 50;
end;
$$;

revoke all on function public.create_private_inquiry(text, text, text, text, text) from public;
revoke all on function public.read_private_inquiries(text, text) from public;
grant execute on function public.create_private_inquiry(text, text, text, text, text) to anon, authenticated;
grant execute on function public.read_private_inquiries(text, text) to anon, authenticated;
