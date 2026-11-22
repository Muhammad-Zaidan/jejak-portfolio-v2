-- Comments on shared posts: visitors write with just a name and an email, and can reply to each other.
-- The email is kept apart (owner-only) so it can never leak through the public read policy.

create table comments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references entries on delete cascade,
  parent_id uuid references comments on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 80),
  body text not null check (length(btrim(body)) between 1 and 3000),
  -- written by the owner while signed in: shown as the author's reply
  by_owner boolean not null default false,
  created_at timestamptz not null default now()
);
create index comments_entry on comments (entry_id, created_at);

create table comment_emails (
  comment_id uuid primary key references comments on delete cascade,
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 200)
);

alter table comments enable row level security;
alter table comment_emails enable row level security;

create policy "public reads comments on shared posts" on comments for select
  using (exists (select 1 from entries e where e.id = entry_id and e.visibility in ('public', 'unlisted')));
create policy "owner all" on comments for all using (is_owner()) with check (is_owner());
create policy "owner all" on comment_emails for all using (is_owner()) with check (is_owner());

grant select on comments to anon, authenticated;
grant all on comments, comment_emails to authenticated;

-- The one way in for visitors: checks the post is shared and the reply stays on the same post, then stores the
-- comment and its email together. Runs as the table owner so visitors need no insert rights of their own.
create function add_comment(p_entry uuid, p_parent uuid, p_name text, p_email text, p_body text) returns uuid
language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if not exists (select 1 from entries where id = p_entry and visibility in ('public', 'unlisted')) then
    raise exception 'post not open for comments';
  end if;
  if p_parent is not null and not exists (select 1 from comments where id = p_parent and entry_id = p_entry) then
    raise exception 'reply to a comment on another post';
  end if;
  insert into comments (entry_id, parent_id, name, body, by_owner)
  values (p_entry, p_parent, btrim(p_name), btrim(p_body), is_owner())
  returning id into new_id;
  insert into comment_emails values (new_id, lower(btrim(p_email)));
  return new_id;
end
$$;
revoke all on function add_comment(uuid, uuid, text, text, text) from public;
grant execute on function add_comment(uuid, uuid, text, text, text) to anon, authenticated;
