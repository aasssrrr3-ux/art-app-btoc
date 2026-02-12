-- Create a public bucket 'process-images'
insert into storage.buckets (id, name, public)
values ('process-images', 'process-images', true);

-- Policy: Public Read
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'process-images' );

-- Policy: Auth Insert (User can upload own images)
create policy "Auth Upload"
on storage.objects for insert
with check (
  bucket_id = 'process-images' 
  and auth.uid() = owner
);

-- Policy: Auth Update (User can update own images)
create policy "Auth Update"
on storage.objects for update
using (
  bucket_id = 'process-images' 
  and auth.uid() = owner
);
