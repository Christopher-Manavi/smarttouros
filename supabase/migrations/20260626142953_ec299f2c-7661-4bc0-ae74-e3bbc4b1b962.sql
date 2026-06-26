
CREATE POLICY "public read listing-media" ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'listing-media');
CREATE POLICY "public read company-logos" ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'company-logos');
