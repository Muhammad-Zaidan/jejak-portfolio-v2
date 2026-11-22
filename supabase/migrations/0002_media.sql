-- Media for posts and projects: images, video, any file. Anyone can view, only the owner uploads.
-- Needs Supabase's storage schema, so it is not part of the PGlite RLS test.

insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800) -- 50 MB, the Supabase free-plan ceiling
on conflict (id) do nothing;

create policy "owner uploads media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_owner());
create policy "owner updates media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_owner());
create policy "owner deletes media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_owner());
