-- Create storage policies for the 'hms' bucket

-- Policy 1: Allow public SELECT (read) access to files in the hms bucket
CREATE POLICY "Allow public read access to hms bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'hms');

-- Policy 2: Allow authenticated users to INSERT (upload) files to the hms bucket
CREATE POLICY "Allow authenticated users to upload to hms bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'hms');

-- Policy 3: Allow authenticated users to UPDATE their own files in the hms bucket
CREATE POLICY "Allow authenticated users to update their own files in hms bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'hms' AND (storage.foldername(name))[1] = 'campaigns')
WITH CHECK (bucket_id = 'hms' AND (storage.foldername(name))[1] = 'campaigns');

-- Policy 4: Allow authenticated users to DELETE their own files in the hms bucket
CREATE POLICY "Allow authenticated users to delete their own files in hms bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'hms' AND (storage.foldername(name))[1] = 'campaigns');

-- Make sure the hms bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'hms';
