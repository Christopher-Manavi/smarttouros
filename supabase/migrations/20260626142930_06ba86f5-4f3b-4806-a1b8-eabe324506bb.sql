
CREATE POLICY "authenticated upload listing-media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-media');
CREATE POLICY "authenticated read listing-media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'listing-media');
CREATE POLICY "authenticated update listing-media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'listing-media');
CREATE POLICY "authenticated delete listing-media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'listing-media');

CREATE POLICY "authenticated upload company-logos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-logos');
CREATE POLICY "authenticated read company-logos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'company-logos');
CREATE POLICY "authenticated update company-logos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'company-logos');
CREATE POLICY "authenticated delete company-logos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'company-logos');
