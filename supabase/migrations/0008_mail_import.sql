-- Bank emails become transactions: who Google is connected as and when mail was last read,
-- where a transaction came from, and the owner's standing rules for naming and filing them.
alter table integrations add column email text not null default '';
alter table integrations add column scopes text not null default '';
alter table integrations add column synced_at timestamptz;

alter table transactions drop constraint transactions_source_check;
alter table transactions add constraint transactions_source_check check (source in ('manual', 'hermes', 'email', 'import'));
alter table transactions add column merchant text not null default '' check (length(merchant) <= 200);

-- "anything from this merchant is that": matched as a case-insensitive substring of the merchant or description
create table tx_rules (
  id uuid primary key default gen_random_uuid(),
  pattern text not null unique check (length(pattern) between 2 and 120),
  title text not null default '' check (length(title) <= 120),
  category_id uuid not null references categories on delete cascade,
  created_at timestamptz not null default now()
);
alter table tx_rules enable row level security;
create policy "owner all" on tx_rules for all using (is_owner()) with check (is_owner());
grant all on tx_rules to authenticated;
