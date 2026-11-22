-- Everything the owner can change about the public site (copy, profile, look) lives in one editable row.
create table site (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table site enable row level security;
create policy "public reads site" on site for select using (true);
create policy "owner all" on site for all using (is_owner()) with check (is_owner());

grant select on site to anon, authenticated;
grant all on site to authenticated;

insert into site default values;
