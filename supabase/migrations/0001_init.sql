-- Portfolio & Personal OS: single-owner schema.
-- Public visitors use the anon key; every private row is guarded by RLS + is_owner().

create table app_owner (email text primary key);

create function is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_owner where email = auth.jwt() ->> 'email')
$$;

-- Writing: notes, ideas, articles, journal. One row per entry, ID/EN side by side.
-- Bodies are HTML from the admin's rich editor (owner-authored, rendered as is).
create table entries (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'note' check (type in ('note', 'idea', 'article', 'journal')),
  visibility text not null default 'draft' check (visibility in ('draft', 'private', 'unlisted', 'public')),
  idea_stage text check (idea_stage in ('new', 'exploring', 'converted', 'archived')),
  slug text unique check (slug ~ '^[a-z0-9-]+$'),
  -- what I build / what I learn / what I think
  category text check (category in ('work', 'learn', 'thought')),
  tags text[] not null default '{}',
  title_id text not null default '',
  title_en text not null default '',
  excerpt_id text not null default '',
  excerpt_en text not null default '',
  body_id text not null default '',
  body_en text not null default '',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- a shared link needs a slug
  check (visibility not in ('public', 'unlisted') or slug is not null)
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  visible boolean not null default false,
  featured boolean not null default false,
  status text not null default 'done' check (status in ('building', 'done', 'archived')),
  sort int not null default 0,
  year int,
  tags text[] not null default '{}',
  stack text[] not null default '{}',
  cover_url text,
  links jsonb not null default '[]',
  title_id text not null default '',
  title_en text not null default '',
  summary_id text not null default '',
  summary_en text not null default '',
  body_id text not null default '',
  body_en text not null default '',
  created_at timestamptz not null default now()
);

-- Money (IDR only for now; currency kept so others can be added later).
create table accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'bank' check (kind in ('cash', 'bank', 'ewallet')),
  currency text not null default 'IDR',
  opening_balance numeric(14, 2) not null default 0
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('income', 'expense')),
  unique (name, kind)
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'IDR',
  account_id uuid not null references accounts on delete restrict,
  category_id uuid not null references categories on delete restrict,
  note text not null default '',
  source text not null default 'manual' check (source in ('manual', 'hermes')),
  external_id text unique,
  reviewed boolean not null default true,
  created_at timestamptz not null default now()
);
create index on transactions (date);

create table budgets (
  month date not null check (extract(day from month) = 1),
  category_id uuid not null references categories on delete cascade,
  amount numeric(14, 2) not null check (amount >= 0),
  primary key (month, category_id)
);

-- Contact form: anyone may write, only the owner may read.
create table messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 200),
  body text not null check (length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

-- OAuth refresh tokens, AES-GCM encrypted by the app before they get here.
create table integrations (
  provider text primary key,
  refresh_token_enc text not null,
  updated_at timestamptz not null default now()
);

alter table app_owner enable row level security;
alter table entries enable row level security;
alter table projects enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table messages enable row level security;
alter table integrations enable row level security;

create policy "public reads shared entries" on entries for select
  using (visibility in ('public', 'unlisted'));
create policy "public reads visible projects" on projects for select
  using (visible);
create policy "anyone sends a message" on messages for insert
  with check (true);

create policy "owner all" on entries for all using (is_owner()) with check (is_owner());
create policy "owner all" on projects for all using (is_owner()) with check (is_owner());
create policy "owner all" on accounts for all using (is_owner()) with check (is_owner());
create policy "owner all" on categories for all using (is_owner()) with check (is_owner());
create policy "owner all" on transactions for all using (is_owner()) with check (is_owner());
create policy "owner all" on budgets for all using (is_owner()) with check (is_owner());
create policy "owner all" on messages for all using (is_owner()) with check (is_owner());
create policy "owner all" on integrations for all using (is_owner()) with check (is_owner());
-- app_owner has no policies: only the service role / SQL editor can change who the owner is.

grant select on entries, projects to anon, authenticated;
grant insert on messages to anon, authenticated;
grant all on entries, projects, accounts, categories, transactions, budgets, messages, integrations to authenticated;
grant execute on function is_owner() to anon, authenticated;
