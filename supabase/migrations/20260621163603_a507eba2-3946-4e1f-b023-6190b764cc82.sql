
ALTER TABLE public.client_band_mapping DROP CONSTRAINT IF EXISTS client_band_mapping_band_type_check;
ALTER TABLE public.client_band_mapping
  ADD CONSTRAINT client_band_mapping_band_type_check
  CHECK (band_type IN ('1-handle','2-handle','flat','figure-8','double-leg-cuff','single-leg-cuff','ankle-weight'));
