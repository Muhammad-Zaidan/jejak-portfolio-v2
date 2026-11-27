-- Money planning: recurring income and saving goals. Owner only.
create table incomes (
  id uuid primary key default gen_random_uuid(),
  name text not null default '' check (length(name) <= 120),
  amount numeric(14, 2) not null check (amount > 0),
  day smallint not null default 25 check (day between 1 and 31),
  starts date not null default current_date,
  ends date check (ends is null or ends >= starts),
  created_at timestamptz not null default now()
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  price numeric(14, 2) not null check (price > 0),
  deadline date,
  created_at timestamptz not null default now()
);

alter table incomes enable row level security;
alter table goals enable row level security;
create policy "owner all" on incomes for all using (is_owner()) with check (is_owner());
create policy "owner all" on goals for all using (is_owner()) with check (is_owner());
grant all on incomes, goals to authenticated;
