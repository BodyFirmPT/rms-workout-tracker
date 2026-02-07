-- Add image_url column to workout_exercise table
ALTER TABLE public.workout_exercise ADD COLUMN image_url text;

-- Create storage bucket for exercise images
INSERT INTO storage.buckets (id, name, public) VALUES ('exercise-images', 'exercise-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Trainers can upload exercise images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exercise-images' 
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to update their images
CREATE POLICY "Trainers can update exercise images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'exercise-images' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'exercise-images' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to delete their images
CREATE POLICY "Trainers can delete exercise images"
ON storage.objects FOR DELETE
USING (bucket_id = 'exercise-images' AND auth.uid() IS NOT NULL);

-- Allow public read access to exercise images (for shared workout links)
CREATE POLICY "Anyone can view exercise images"
ON storage.objects FOR SELECT
USING (bucket_id = 'exercise-images');