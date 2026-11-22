-- Projects become writing: a project is an article in the 'project' category, and the home page's selected
-- projects are the featured ones. Articles also get a thumbnail.

alter table entries add column cover_url text;
alter table entries add column featured boolean not null default false;

alter table entries drop constraint entries_category_check;
alter table entries add constraint entries_category_check
  check (category in ('project', 'work', 'learn', 'thought'));

-- Carry existing projects over as project articles. The projects table stays (nothing is deleted), but the site
-- and the back office no longer read it.
insert into entries (type, visibility, slug, category, tags, title_id, title_en, excerpt_id, excerpt_en,
                     body_id, body_en, cover_url, featured, published_at)
select 'article',
       case when p.visible then 'public' else 'draft' end,
       p.slug,
       'project',
       p.tags || p.stack,
       p.title_id, p.title_en, p.summary_id, p.summary_en,
       p.body_id, p.body_en,
       p.cover_url,
       p.featured,
       case when p.visible then coalesce(make_timestamptz(p.year, 6, 1, 0, 0, 0), p.created_at) end
from projects p
where not exists (select 1 from entries e where e.slug = p.slug);
