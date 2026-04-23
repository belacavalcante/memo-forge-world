
-- Tornar bucket avatars privado para evitar listagem pública
update storage.buckets set public = false where id = 'avatars';

drop policy if exists "avatars_public_select" on storage.objects;
create policy "avatars_authenticated_select" on storage.objects for select
  using (bucket_id = 'avatars' and auth.uid() is not null);
