-- Add category column to muscle_group table
ALTER TABLE public.muscle_group 
ADD COLUMN category text CHECK (category IN ('Core', 'Arms', 'Legs'));

-- Update existing default muscle groups with categories
UPDATE public.muscle_group 
SET category = CASE 
  WHEN name ILIKE '%chest%' OR name ILIKE '%back%' OR name ILIKE '%shoulder%' OR name ILIKE '%bicep%' OR name ILIKE '%tricep%' OR name ILIKE '%arm%' THEN 'Arms'
  WHEN name ILIKE '%leg%' OR name ILIKE '%quad%' OR name ILIKE '%hamstring%' OR name ILIKE '%calf%' OR name ILIKE '%glute%' THEN 'Legs'
  WHEN name ILIKE '%core%' OR name ILIKE '%ab%' OR name ILIKE '%oblique%' THEN 'Core'
  ELSE NULL
END
WHERE default_group = true;