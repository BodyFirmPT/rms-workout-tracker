
ALTER TABLE public.client_band_mapping ADD COLUMN band_type text;

-- Backfill: existing ankle_weight rows map to 'ankle-weight' band type.
-- Existing 'band' rows are ambiguous (any of 1-handle / 2-handle / flat / figure-8); delete them.
UPDATE public.client_band_mapping SET band_type = 'ankle-weight' WHERE band_category = 'ankle_weight';
DELETE FROM public.client_band_mapping WHERE band_category = 'band';

ALTER TABLE public.client_band_mapping ALTER COLUMN band_type SET NOT NULL;

ALTER TABLE public.client_band_mapping DROP CONSTRAINT IF EXISTS client_band_mapping_unique;
ALTER TABLE public.client_band_mapping DROP CONSTRAINT IF EXISTS client_band_mapping_client_id_band_category_resistance_leve_key;
ALTER TABLE public.client_band_mapping DROP CONSTRAINT IF EXISTS client_band_mapping_band_category_check;
ALTER TABLE public.client_band_mapping DROP COLUMN band_category;

ALTER TABLE public.client_band_mapping
  ADD CONSTRAINT client_band_mapping_band_type_check
  CHECK (band_type IN ('1-handle','2-handle','flat','figure-8','ankle-weight'));

ALTER TABLE public.client_band_mapping
  ADD CONSTRAINT client_band_mapping_unique UNIQUE (client_id, band_type, resistance_level);
