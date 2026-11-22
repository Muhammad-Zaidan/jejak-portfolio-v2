// Runs the real migration in an in-process Postgres and checks that visitors never see private data.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

const db = new PGlite()
// Minimal stand-ins for what Supabase provides.
await db.exec(`
  create role anon; create role authenticated;
  create schema auth;
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  grant usage on schema auth to anon, authenticated;
`)
await db.exec(readFileSync(new URL('../supabase/migrations/0001_init.sql', import.meta.url), 'utf8'))
await db.exec(readFileSync(new URL('../supabase/migrations/0003_site.sql', import.meta.url), 'utf8'))
await db.exec(`
  insert into app_owner values ('owner@example.com');
  insert into entries (type, visibility, slug, title_id) values
    ('article', 'public', 'hello', 'Halo'),
    ('article', 'unlisted', 'secret-link', 'Lewat tautan'),
    ('note', 'private', null, 'Catatan pribadi'),
    ('article', 'draft', null, 'Draft');
  insert into projects (slug, visible) values ('shown', true), ('hidden', false);
  insert into accounts (id, name) values ('00000000-0000-0000-0000-000000000001', 'BCA');
  insert into categories (id, name, kind) values ('00000000-0000-0000-0000-000000000002', 'Makan', 'expense');
  insert into transactions (amount, account_id, category_id) values
    (25000, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
  insert into integrations values ('google', 'enc');
  insert into messages (name, email, body) values ('A', 'a@b.co', 'hai');
`)
// after the seed rows above, so the projects they insert get carried over as project articles
await db.exec(readFileSync(new URL('../supabase/migrations/0004_writing.sql', import.meta.url), 'utf8'))
await db.exec(readFileSync(new URL('../supabase/migrations/0005_comments.sql', import.meta.url), 'utf8'))

async function as(role, email, sql) {
  const claims = email ? JSON.stringify({ email }) : ''
  const [, , res] = await db.exec(`
    set role ${role};
    select set_config('request.jwt.claims', '${claims}', false);
    ${sql};
  `)
  await db.exec('reset role')
  return res.rows
}

const privateTables = ['accounts', 'categories', 'transactions', 'budgets', 'integrations', 'messages', 'comment_emails']

test('visitor sees only shared entries and visible projects', async () => {
  // 'shown' is the visible project carried over as a public article; the hidden one became a draft
  const entries = await as('anon', null, 'select slug from entries order by slug')
  assert.deepEqual(entries.map((r) => r.slug), ['hello', 'secret-link', 'shown'])
  assert.equal((await as('anon', null, "select category from entries where slug = 'shown'"))[0].category, 'project')
  const projects = await as('anon', null, 'select slug from projects')
  assert.deepEqual(projects.map((r) => r.slug), ['shown'])
})

test('visitor cannot read any private table', async () => {
  for (const t of privateTables) {
    await assert.rejects(as('anon', null, `select * from ${t}`), /permission denied/, t)
  }
})

test('a signed-in stranger is treated like a visitor', async () => {
  for (const t of privateTables) {
    assert.equal((await as('authenticated', 'stranger@example.com', `select * from ${t}`)).length, 0, t)
  }
  const entries = await as('authenticated', 'stranger@example.com', 'select * from entries')
  assert.equal(entries.length, 3) // the same three public/unlisted ones a visitor sees
  await assert.rejects(
    as('authenticated', 'stranger@example.com', "insert into app_owner values ('stranger@example.com')"),
    /permission denied/,
  )
})

test('owner sees everything', async () => {
  assert.equal((await as('authenticated', 'owner@example.com', 'select * from entries')).length, 6) // 4 + 2 carried-over projects
  assert.equal((await as('authenticated', 'owner@example.com', 'select * from projects')).length, 2)
  for (const t of ['accounts', 'transactions', 'integrations', 'messages']) {
    assert.equal((await as('authenticated', 'owner@example.com', `select * from ${t}`)).length, 1, t)
  }
})

test('visitor can send a message but not read it back', async () => {
  await as('anon', null, "insert into messages (name, email, body) values ('B', 'b@c.co', 'halo')")
  await assert.rejects(as('anon', null, 'select * from messages'), /permission denied/)
  await assert.rejects(as('anon', null, "insert into messages (name, email, body) values ('B', 'bukan-email', 'x')"))
})

test('writing has exactly four categories', async () => {
  await db.exec("insert into entries (category) values ('project'), ('work'), ('learn'), ('thought'), (null)")
  await assert.rejects(db.exec("insert into entries (category) values ('Software')"), /check/)
})

test('visitor cannot write entries', async () => {
  await assert.rejects(as('anon', null, "insert into entries (title_id) values ('x')"), /permission denied/)
})

test('site settings: everyone reads, only the owner writes', async () => {
  assert.equal((await as('anon', null, 'select * from site')).length, 1)
  await assert.rejects(as('anon', null, "update site set data = '{}'"), /permission denied/)
  // a stranger's update is silently filtered by RLS: nothing changes
  await as('authenticated', 'stranger@example.com', `update site set data = '{"name":"x"}'`)
  assert.deepEqual((await as('anon', null, 'select data from site'))[0].data, {})
  await as('authenticated', 'owner@example.com', `update site set data = '{"name":"Zaidan"}'`)
  assert.equal((await as('anon', null, 'select data from site'))[0].data.name, 'Zaidan')
})

test('visitors comment and reply on shared posts only; their email stays private', async () => {
  const add = (who, entry, parent, email = 'tamu@example.com') =>
    as(who, null, `select add_comment((select id from entries where ${entry}), ${parent}, 'Tamu', '${email}', 'Halo') as id`)
  const [{ id }] = await add('anon', "slug = 'hello'", 'null')
  await add('anon', "slug = 'hello'", `'${id}'`) // a reply
  await assert.rejects(add('anon', "title_id = 'Draft'", 'null'), /not open/)
  await assert.rejects(add('anon', "slug = 'secret-link'", `'${id}'`), /another post/) // reply moved to another post
  await assert.rejects(add('anon', "slug = 'hello'", 'null', 'bukan-email'), /check/)
  const seen = await as('anon', null, 'select * from comments')
  assert.equal(seen.length, 2)
  assert.ok(!('email' in seen[0]) && seen.every((c) => !c.by_owner))
  await assert.rejects(as('anon', null, "insert into comments (entry_id, name, body) select id, 'x', 'y' from entries limit 1"), /permission denied/)
  await assert.rejects(as('anon', null, 'delete from comments'), /permission denied/)
  assert.equal((await as('anon', null, 'select * from comments')).length, 2)
  // the owner's reply is marked as the author's, and only the owner sees emails
  await as('authenticated', 'owner@example.com', `select add_comment((select id from entries where slug = 'hello'), '${id}', 'Zaidan', 'owner@example.com', 'Terima kasih')`)
  assert.equal((await as('anon', null, 'select * from comments where by_owner')).length, 1)
  assert.equal((await as('authenticated', 'owner@example.com', 'select * from comment_emails')).length, 3)
})
