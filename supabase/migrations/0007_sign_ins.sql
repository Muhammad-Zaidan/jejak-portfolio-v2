-- Every sign-in to the back office, tagged with the device it came from (a long-lived random cookie). Owner only.
create table sign_ins (
  id uuid primary key default gen_random_uuid(),
  device text not null check (length(device) between 8 and 64),
  method text not null check (method in ('passkey', 'email', 'google')),
  user_agent text not null default '' check (length(user_agent) <= 400),
  ip text not null default '' check (length(ip) <= 64),
  at timestamptz not null default now()
);
create index sign_ins_device on sign_ins (device, at desc);

alter table sign_ins enable row level security;
create policy "owner all" on sign_ins for all using (is_owner()) with check (is_owner());
grant all on sign_ins to authenticated;
