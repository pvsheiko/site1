-- Supabase → SQL Editor → New query → Run. Safe to rerun.
create table if not exists public.leads (
  id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 80),
  contact text not null check (char_length(contact) between 5 and 120),
  message text not null default '' check (char_length(message) <= 2000),
  page text not null default '/' check (char_length(page) <= 500),
  utm jsonb not null default '{}'::jsonb,
  consent boolean not null check (consent),
  consent_version text not null default '2026-10-20',
  status text not null default 'new' check (status in ('new','in_progress','completed')),
  ip_hash text not null,
  telegram_message_id bigint,
  telegram_sent_at timestamptz,
  notification_claimed_at timestamptz
);
create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_ip_created_idx on public.leads (ip_hash, created_at desc);
alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;
grant select, insert, update, delete on public.leads to service_role;

-- Durable rate limit and idempotency shared across Vercel instances.
create or replace function public.submit_lead(
 p_id uuid, p_name text, p_contact text, p_message text,
 p_page text, p_utm jsonb, p_ip_hash text
) returns setof public.leads language plpgsql security invoker set search_path = public as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_ip_hash, 0));
 if exists (select 1 from public.leads where id = p_id) then
  return query select * from public.leads where id = p_id;
  return;
 end if;
 if (select count(*) from public.leads where ip_hash = p_ip_hash and created_at > now() - interval '10 minutes') >= 3 then
  raise exception 'LEAD_RATE_LIMIT' using errcode = 'P0001';
 end if;
 return query insert into public.leads (id,name,contact,message,page,utm,ip_hash,consent)
 values (p_id,p_name,p_contact,p_message,p_page,p_utm,p_ip_hash,true) returning *;
end; $$;
revoke all on function public.submit_lead(uuid,text,text,text,text,jsonb,text) from public, anon, authenticated;
grant execute on function public.submit_lead(uuid,text,text,text,text,jsonb,text) to service_role;

-- Claim prevents duplicate Telegram notifications from concurrent retries.
create or replace function public.claim_lead_notification(p_id uuid)
returns setof public.leads language sql security invoker set search_path = public as $$
 update public.leads set notification_claimed_at = now()
 where id = p_id and telegram_sent_at is null
 and (notification_claimed_at is null or notification_claimed_at < now() - interval '1 minute')
 returning *;
$$;
revoke all on function public.claim_lead_notification(uuid) from public, anon, authenticated;
grant execute on function public.claim_lead_notification(uuid) to service_role;
